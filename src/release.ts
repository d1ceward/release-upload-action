import { context } from '@actions/github'

export default function getReleaseTag(): string {
  const { ref } = context

  let tag = ''
  if (ref.startsWith('refs/tags/')) tag = ref.replace('refs/tags/', '')

  if (!tag.length) throw new Error('No release tag found')

  return tag
}
