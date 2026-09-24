"""
Bake licensed source car GLBs into ShiftForge's normalized lab format.

    blender -b --python scripts/bake-car-models.py -- scripts/car-models.json [slug ...]

For each manifest entry this:
  1. imports the source GLB and applies all transforms,
  2. finds the four tires geometrically (disc-shaped, one per lower corner) — source files have no
     reliable naming, so nothing here keys off object names,
  3. deletes every loose-part island that sits entirely inside a wheel cylinder (tire, rim, brakes,
     lugs); body panels survive because they extend outside it,
  4. orients the car +X forward / +Z up, scales it to the catalog length and puts the tire contact
     patch on z=0,
  5. adds empties WHEEL_FL/FR/RL/RR at the hub centers with `tireRadius` / `tireWidth` extras and
     tags body-paint materials with `shiftforgePaint` so the lab can recolor them,
  6. exports Draco + WebP to public/models/cars/<slug>.glb and a side-view preview PNG.

Source models are third-party (several are CC-BY-NC) and the output directory is gitignored.
"""

import bpy
import bmesh
import json
import math
import os
import re
import sys
from mathutils import Vector, Matrix

ARGV = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
MANIFEST = os.path.abspath(ARGV[0] if ARGV else os.path.join(os.path.dirname(__file__), 'car-models.json'))
ONLY = set(ARGV[1:])
ROOT = os.path.dirname(os.path.dirname(MANIFEST))
OUT_DIR = os.path.join(ROOT, 'public', 'models', 'cars')
PREVIEW_DIR = os.path.join(ROOT, 'test-results', 'car-bakes')

PAINT_NAME = re.compile(r'paint|carmain|body|shell|exterior', re.I)
NOT_PAINT = re.compile(r'glass|window|black|chrome|plastic|rubber|tire|tyre|interior|int_|leather|light|lamp|mirror|trim|grill|carbon|metal|decal|badge|logo|screen|seat', re.I)


def log(*a):
    print('[bake]', *a, flush=True)


def world_bbox(objs):
    lo = Vector((1e18,) * 3)
    hi = Vector((-1e18,) * 3)
    for o in objs:
        for v in o.data.vertices:
            p = v.co
            lo = Vector(map(min, lo, p))
            hi = Vector(map(max, hi, p))
    return lo, hi


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def import_and_flatten(path):
    bpy.ops.import_scene.gltf(filepath=path, merge_vertices=False)
    meshes = [o for o in bpy.data.objects if o.type == 'MESH']
    # Bake every transform into vertex data so all geometry lives in one frame.
    for o in meshes:
        mw = o.matrix_world.copy()
        if o.data.users > 1:
            o.data = o.data.copy()
        o.data.transform(mw)
        o.parent = None
        o.matrix_world = Matrix.Identity(4)
    for o in [o for o in bpy.data.objects if o.type != 'MESH']:
        bpy.data.objects.remove(o, do_unlink=True)
    # Drop degenerate / empty meshes.
    for o in list(meshes):
        if len(o.data.vertices) == 0:
            meshes.remove(o)
            bpy.data.objects.remove(o, do_unlink=True)
    return meshes


def to_meters_z_up(meshes, spec):
    """Rotate so the long axis is X, up is Z; flip if the manifest says the nose is at -X."""
    lo, hi = world_bbox(meshes)
    size = hi - lo
    center = (lo + hi) / 2
    m = Matrix.Translation(-center)
    if size.y > size.x:
        m = Matrix.Rotation(math.radians(90), 4, 'Z') @ m
    if spec.get('flip'):
        m = Matrix.Rotation(math.radians(180), 4, 'Z') @ m
    for o in meshes:
        o.data.transform(m)
        o.data.update()


def mesh_bbox(o):
    lo, hi = world_bbox([o])
    return lo, hi, (lo + hi) / 2, hi - lo


def find_tires(meshes):
    lo, hi = world_bbox(meshes)
    size = hi - lo
    cands = []
    for o in meshes:
        blo, bhi, c, s = mesh_bbox(o)
        if s.z <= 0:
            continue
        # Tire / wheel: round in the X-Z plane, narrow across Y, low, and out at a corner.
        round_ = 0.8 < s.x / s.z < 1.25
        narrow = s.y < s.z * 0.75
        diam_ok = 0.12 * size.z < s.z < 0.62 * size.z
        low = (c.z - lo.z) < 0.4 * size.z
        corner = abs(c.x) > 0.18 * size.x and abs(c.y) > 0.22 * size.y
        if round_ and narrow and diam_ok and low and corner:
            cands.append((o, c, s))
    tires = {}
    for o, c, s in cands:
        key = ('F' if c.x > 0 else 'R') + ('L' if c.y > 0 else 'R')
        # Largest disc per corner is the tire (rims/brakes nest inside it).
        if key not in tires or s.z > tires[key][2].z:
            tires[key] = (o, c, s)
    if len(tires) != 4:
        raise RuntimeError(f'expected 4 tire corners, found {sorted(tires)} from {len(cands)} candidates')
    return {k: {'center': v[1].copy(), 'radius': max(v[2].x, v[2].z) / 2, 'width': v[2].y, 'object': v[0].name} for k, v in tires.items()}


def inside_wheel(p, w, inboard):
    c = w['center']
    r = w['radius'] * 1.04
    dx, dz = p.x - c.x, p.z - c.z
    if dx * dx + dz * dz > r * r:
        return False
    half = w['width'] / 2
    sign = 1 if c.y > 0 else -1
    # Local lateral coordinate, positive outboard.
    t = (p.y - c.y) * sign
    return -(half + inboard) <= t <= half + 0.12 * half


def strip_wheels(meshes, wheels):
    inboard = max(w['width'] for w in wheels.values()) * 0.9
    removed_islands = 0
    for o in list(meshes):
        bm = bmesh.new()
        bm.from_mesh(o.data)
        bm.verts.ensure_lookup_table()
        seen = set()
        doomed = []
        for v in bm.verts:
            if v.index in seen:
                continue
            island = []
            stack = [v]
            seen.add(v.index)
            while stack:
                cur = stack.pop()
                island.append(cur)
                for e in cur.link_edges:
                    nv = e.other_vert(cur)
                    if nv.index not in seen:
                        seen.add(nv.index)
                        stack.append(nv)
            for w in wheels.values():
                if all(inside_wheel(p.co, w, inboard) for p in island):
                    doomed.extend(island)
                    removed_islands += 1
                    break
        if doomed:
            bmesh.ops.delete(bm, geom=list({id(v): v for v in doomed}.values()), context='VERTS')
            bm.to_mesh(o.data)
            o.data.update()
        bm.free()
        if len(o.data.vertices) == 0:
            meshes.remove(o)
            bpy.data.objects.remove(o, do_unlink=True)
    return removed_islands


def scale_and_ground(meshes, wheels, spec):
    lo, hi = world_bbox(meshes)
    length = hi.x - lo.x
    k = spec['lengthMm'] / 1000 / length
    cx = (lo.x + hi.x) / 2
    cy = (lo.y + hi.y) / 2
    # Tires rest on the ground: the average tire bottom goes to z=0.
    ground = sum(w['center'].z - w['radius'] for w in wheels.values()) / 4
    m = Matrix.Scale(k, 4) @ Matrix.Translation(Vector((-cx, -cy, -ground)))
    for o in meshes:
        o.data.transform(m)
        o.data.update()
    for w in wheels.values():
        w['center'] = m @ w['center']
        w['radius'] *= k
        w['width'] *= k
    return k


def tag_paint(meshes):
    area = {}
    for o in meshes:
        me = o.data
        for poly in me.polygons:
            if poly.material_index < len(o.material_slots):
                mat = o.material_slots[poly.material_index].material
                if mat:
                    area[mat.name] = area.get(mat.name, 0) + poly.area
    named = [n for n in area if PAINT_NAME.search(n) and not NOT_PAINT.search(n)]
    if not named:
        # Fallback: the largest-area material that is not obviously something else.
        rest = sorted((a, n) for n, a in area.items() if not NOT_PAINT.search(n))
        named = [rest[-1][1]] if rest else []
    for n in named:
        bpy.data.materials[n]['shiftforgePaint'] = True
    return named, sorted(area.items(), key=lambda kv: -kv[1])[:8]


def add_anchors(wheels):
    names = {'FL': 'WHEEL_FL', 'FR': 'WHEEL_FR', 'RL': 'WHEEL_RL', 'RR': 'WHEEL_RR'}
    for key, w in wheels.items():
        e = bpy.data.objects.new(names[key], None)
        e.empty_display_type = 'SPHERE'
        e.empty_display_size = w['radius'] * 0.3
        e.location = w['center']
        e['tireRadius'] = round(w['radius'], 4)
        e['tireWidth'] = round(w['width'], 4)
        bpy.context.scene.collection.objects.link(e)


def downscale_images(max_px):
    for img in bpy.data.images:
        if img.size[0] > max_px or img.size[1] > max_px:
            s = max_px / max(img.size)
            img.scale(max(1, int(img.size[0] * s)), max(1, int(img.size[1] * s)))


def export(slug, spec):
    os.makedirs(OUT_DIR, exist_ok=True)
    out = os.path.join(OUT_DIR, f'{slug}.glb')
    kw = dict(
        filepath=out,
        export_format='GLB',
        export_extras=True,
        export_yup=True,
        export_apply=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=7,
        export_draco_position_quantization=14,
        export_draco_normal_quantization=10,
        export_draco_texcoord_quantization=12,
    )
    props = bpy.ops.export_scene.gltf.get_rna_type().properties
    if 'export_image_format' in props and 'WEBP' in [i.identifier for i in props['export_image_format'].enum_items]:
        kw['export_image_format'] = 'WEBP'
        kw['export_image_quality'] = 85
    bpy.ops.export_scene.gltf(**kw)
    return out


def preview(slug, spec):
    os.makedirs(PREVIEW_DIR, exist_ok=True)
    scene = bpy.context.scene
    L = spec['lengthMm'] / 1000
    for o in list(bpy.data.objects):
        if o.type == 'EMPTY':
            # Visual marker so anchor placement is checkable in the render.
            bpy.ops.mesh.primitive_uv_sphere_add(radius=o['tireRadius'], location=o.location)
            m = bpy.context.active_object
            m.scale.y = 0.15
            mat = bpy.data.materials.new('marker')
            mat.diffuse_color = (1, 0.1, 0.4, 1)
            m.data.materials.append(mat)
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
    cam.data.type = 'ORTHO'
    cam.data.ortho_scale = L * 1.15
    cam.location = (0, -L * 3, L * 0.18)
    cam.rotation_euler = (math.radians(90), 0, 0)
    scene.collection.objects.link(cam)
    scene.camera = cam
    try:
        scene.render.engine = 'BLENDER_WORKBENCH'
    except TypeError:
        pass
    scene.display.shading.light = 'STUDIO'
    scene.display.shading.color_type = 'MATERIAL'
    scene.render.resolution_x = 1000
    scene.render.resolution_y = 420
    scene.render.filepath = os.path.join(PREVIEW_DIR, f'{slug}-side.png')
    try:
        bpy.ops.render.render(write_still=True)
    except Exception as err:  # headless GPU contexts can refuse; the bake itself is still valid
        log('preview failed', err)


def bake(slug, spec):
    reset()
    meshes = import_and_flatten(os.path.expanduser(spec['src']))
    to_meters_z_up(meshes, spec)
    wheels = find_tires(meshes)
    islands = strip_wheels(meshes, wheels)
    k = scale_and_ground(meshes, wheels, spec)
    paint, top = tag_paint(meshes)
    add_anchors(wheels)
    downscale_images(spec.get('maxTexture', 2048))
    out = export(slug, spec)
    lo, hi = world_bbox(meshes)
    wb = (wheels['FL']['center'].x + wheels['FR']['center'].x) / 2 - (wheels['RL']['center'].x + wheels['RR']['center'].x) / 2
    report = {
        'slug': slug,
        'bytes': os.path.getsize(out),
        'scale': k,
        'size': [round(v, 3) for v in (hi - lo)],
        'wheelbase': round(wb, 3),
        'wheels': {key: {'center': [round(v, 3) for v in w['center']], 'radius': round(w['radius'], 3), 'width': round(w['width'], 3), 'from': w['object']} for key, w in wheels.items()},
        'islandsRemoved': islands,
        'paint': paint,
        'topMaterials': [n for n, _ in top],
    }
    log('REPORT', json.dumps(report))
    preview(slug, spec)


def main():
    with open(MANIFEST) as f:
        manifest = json.load(f)
    failed = []
    for slug, spec in manifest.items():
        if ONLY and slug not in ONLY:
            continue
        log('baking', slug)
        try:
            bake(slug, spec)
        except Exception as err:
            log('FAILED', slug, repr(err))
            failed.append(slug)
    if failed:
        log('failed:', ', '.join(failed))
        sys.exit(1)


main()
