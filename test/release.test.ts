import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'
import { context } from '@actions/github'

// Local imports
import getReleaseTag from '../src/release.ts'

const originalRef = context.ref

afterEach(() => {
  context.ref = originalRef
})

describe('getReleaseTag', () => {
  it('extracts the tag name from a tag ref', () => {
    context.ref = 'refs/tags/v1.2.3'

    assert.equal(getReleaseTag(), 'v1.2.3')
  })

  it('keeps slashes present in the tag name', () => {
    context.ref = 'refs/tags/release/2024-01-01'

    assert.equal(getReleaseTag(), 'release/2024-01-01')
  })

  it('only strips the leading refs/tags/ prefix', () => {
    context.ref = 'refs/tags/refs/tags/v1'

    assert.equal(getReleaseTag(), 'refs/tags/v1')
  })

  it('throws when the ref is a branch', () => {
    context.ref = 'refs/heads/develop'

    assert.throws(() => getReleaseTag(), { message: 'No release tag found' })
  })

  it('throws when the ref is an empty tag', () => {
    context.ref = 'refs/tags/'

    assert.throws(() => getReleaseTag(), { message: 'No release tag found' })
  })

  it('throws when the ref is empty', () => {
    context.ref = ''

    assert.throws(() => getReleaseTag(), { message: 'No release tag found' })
  })
})
