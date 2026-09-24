import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getBuild } from '@/lib/builds';
import { defaultConfigFor, sanitizeConfig } from '@/lib/build-config';
import { getModel, listModels, listParts, modelLabel } from '@/lib/catalog';
import LabClient from '@/components/lab/LabClient';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ build?: string; from?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const model = getModel((await params).slug);
  if (!model) return { title: '3D Mods Lab' };
  return {
    title: `${modelLabel(model)} — 3D Mods Lab`,
    description: `Try wheels, offsets, tires, lowering and aero on the ${model.make} ${model.model} ${model.generation} in 3D with a live fitment check.`,
    alternates: { canonical: `/garage/${model.slug}` },
  };
}

export default async function LabPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const model = getModel(slug);
  if (!model) notFound();
  const user = await getCurrentUser();

  let config = defaultConfigFor(model);
  let title = `My ${model.model} ${model.generation}`;
  let description = '';
  let buildId: number | null = null;
  let notice: string | null = null;
  const sourceId = Number(sp.build ?? sp.from);
  if (sourceId) {
    const source = getBuild(sourceId);
    if (source && source.modelId === model.id) {
      config = sanitizeConfig(source.config, model);
      if (sp.build && user && source.user.id === user.id) {
        buildId = source.id;
        title = source.title;
        description = source.description;
      } else {
        title = `${source.title} (remix)`;
        notice = `Remixing “${source.title}” by ${source.user.name}. Publishing creates your own copy.`;
      }
    }
  }

  const parts = listParts({ sort: 'name' });
  return (
    <LabClient
      model={model}
      models={listModels().map((m) => ({ slug: m.slug, label: modelLabel(m) }))}
      parts={parts}
      initialConfig={config}
      initialTitle={title}
      initialDescription={description}
      buildId={buildId}
      signedIn={!!user}
      notice={notice}
    />
  );
}
