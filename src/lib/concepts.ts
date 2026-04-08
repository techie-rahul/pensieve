/* ------------------------------------------------------------------ */
/*  Pensieve — Psychological & Philosophical Concept Library          */
/* ------------------------------------------------------------------ */

export interface Concept {
  id: string
  name: string
  description: string
  citation: string
}

export const concepts: Concept[] = [
  {
    id: 'cognitive-distortions',
    name: 'Cognitive Distortions',
    description:
      'Systematic errors in thinking that reinforce negative thought patterns. Common forms include catastrophising (assuming the worst), black-and-white thinking (seeing no middle ground), and personalisation (blaming yourself for external events). Recognising these patterns is the first step toward reframing them.',
    citation: 'Beck, A. T. (1976). Cognitive Therapy and the Emotional Disorders. Penguin Books.',
  },
  {
    id: 'growth-mindset',
    name: 'Growth Mindset',
    description:
      'The belief that abilities and intelligence can be developed through dedication and effort, rather than being fixed traits. People with a growth mindset tend to embrace challenges, persist through setbacks, and view effort as a path to mastery rather than a sign of inadequacy.',
    citation: 'Dweck, C. S. (2006). Mindset: The New Psychology of Success. Random House.',
  },
  {
    id: 'emotional-granularity',
    name: 'Emotional Granularity',
    description:
      'The ability to make fine-grained distinctions between similar emotions — for example, distinguishing frustration from disappointment, or excitement from anxiety. Higher emotional granularity is linked to better emotional regulation and more adaptive coping strategies.',
    citation: 'Barrett, L. F. (2017). How Emotions Are Made: The Secret Life of the Brain. Houghton Mifflin Harcourt.',
  },
  {
    id: 'dichotomy-of-control',
    name: 'Stoic Dichotomy of Control',
    description:
      'The Stoic practice of distinguishing between what is within our control (our own judgments, intentions, desires) and what is not (other people\'s actions, external events, outcomes). Peace comes from focusing energy only on what we can influence and accepting the rest with equanimity.',
    citation: 'Epictetus. (c. 135 CE). The Enchiridion (Handbook). Translated by Elizabeth Carter.',
  },
  {
    id: 'meaning-making',
    name: 'Existential Meaning-Making',
    description:
      'The human capacity to find purpose and significance even in suffering. Meaning is not discovered passively but actively constructed through our choices, responsibilities, and the attitude we take toward unavoidable hardship.',
    citation: 'Frankl, V. E. (1946). Man\'s Search for Meaning. Beacon Press.',
  },
  {
    id: 'self-compassion',
    name: 'Self-Compassion',
    description:
      'Treating yourself with the same kindness and understanding you would offer a close friend during moments of failure or inadequacy. It involves three components: self-kindness over self-judgment, common humanity over isolation, and mindfulness over over-identification with negative emotions.',
    citation: 'Neff, K. D. (2011). Self-Compassion: The Proven Power of Being Kind to Yourself. William Morrow.',
  },
  {
    id: 'flow-state',
    name: 'Flow State',
    description:
      'A mental state of complete absorption in an activity where the challenge level closely matches one\'s skill level. In flow, self-consciousness fades, time perception shifts, and intrinsic motivation peaks. It is associated with heightened creativity and well-being.',
    citation: 'Csikszentmihalyi, M. (1990). Flow: The Psychology of Optimal Experience. Harper & Row.',
  },
  {
    id: 'narrative-identity',
    name: 'Narrative Identity',
    description:
      'The internalised, evolving story we construct about ourselves to make sense of our lives. How we narrate our experiences — as stories of redemption, growth, contamination, or agency — shapes our sense of self and influences future behaviour.',
    citation: 'McAdams, D. P. (2001). The Psychology of Life Stories. Review of General Psychology, 5(2), 100–122.',
  },
]

/**
 * Formats a subset of concepts into a text block for inclusion in an LLM prompt.
 */
export function formatConceptsForPrompt(): string {
  return concepts
    .map(
      (c) =>
        `**${c.name}** — ${c.description}\n  _Source: ${c.citation}_`,
    )
    .join('\n\n')
}
