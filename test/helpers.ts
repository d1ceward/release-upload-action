import { mock } from 'node:test'

export type CoreStub = {
  debug: ReturnType<typeof mock.fn>
  info: ReturnType<typeof mock.fn>
  warning: ReturnType<typeof mock.fn>
  setFailed: ReturnType<typeof mock.fn>
}

export type OctokitStub = {
  listReleases: ReturnType<typeof mock.fn>
  createRelease: ReturnType<typeof mock.fn>
  uploadReleaseAsset: ReturnType<typeof mock.fn>
  getOctokit: ReturnType<typeof mock.fn>
}

export type Harness = {
  core: CoreStub
  octokit: OctokitStub
  readFile: ReturnType<typeof mock.fn>
}

export type Scenario = {
  ref?: string
  sha?: string
  repo?: { owner: string; repo: string }
  files?: string[]
  token?: string
  existingTags?: string[]
  releaseId?: number
  fileContents?: Record<string, Buffer>
  readFileError?: Error
}

type State = {
  inputs: Record<string, string>
  multilineInputs: Record<string, string[]>
  harness: Harness
}

// The mocked modules are installed once and read from this holder, because
// `mock.module` refuses to mock the same specifier twice in a process.
let state: State

// Exported bindings of a mocked module are snapshotted when it is created, so
// the context has to stay the same object and be mutated between scenarios.
const context = { ref: '', sha: '', repo: { owner: '', repo: '' } }

mock.module('@actions/core', {
  exports: {
    getInput: (name: string) => state.inputs[name] ?? '',
    getMultilineInput: (name: string) => state.multilineInputs[name] ?? [],
    debug: (...args: unknown[]) => state.harness.core.debug(...args),
    info: (...args: unknown[]) => state.harness.core.info(...args),
    warning: (...args: unknown[]) => state.harness.core.warning(...args),
    setFailed: (...args: unknown[]) => state.harness.core.setFailed(...args)
  }
})

mock.module('@actions/github', {
  exports: {
    getOctokit: (...args: unknown[]) => state.harness.octokit.getOctokit(...args),
    context
  }
})

mock.module('node:fs/promises', {
  exports: { readFile: (...args: unknown[]) => state.harness.readFile(...args) }
})

/**
 * Prepares the stubs for one scenario and returns a freshly evaluated `run`
 * bound to them, together with the stubs for assertions.
 */
export async function setupRun(scenario: Scenario = {}): Promise<{
  run: () => Promise<void>
  harness: Harness
}> {
  const {
    ref = 'refs/tags/v1.2.3',
    sha = 'deadbeef',
    repo = { owner: 'd1ceward', repo: 'release-upload-action' },
    files = ['bin/release-linux'],
    token = 'secret-token',
    existingTags = [],
    releaseId = 42,
    fileContents = {},
    readFileError
  } = scenario

  const octokit: OctokitStub = {
    listReleases: mock.fn(async () => ({ data: existingTags.map(tag_name => ({ tag_name })) })),
    createRelease: mock.fn(async () => ({ data: { id: releaseId } })),
    uploadReleaseAsset: mock.fn(async ({ name }: { name: string }) => ({
      data: { browser_download_url: `https://example.test/${name}` }
    })),
    getOctokit: mock.fn(() => ({
      rest: {
        repos: {
          listReleases: octokit.listReleases,
          createRelease: octokit.createRelease,
          uploadReleaseAsset: octokit.uploadReleaseAsset
        }
      }
    }))
  }

  const harness: Harness = {
    core: { debug: mock.fn(), info: mock.fn(), warning: mock.fn(), setFailed: mock.fn() },
    octokit,
    readFile: mock.fn(async (path: string) => {
      if (readFileError) throw readFileError

      return fileContents[path] ?? Buffer.from(`contents of ${path}`)
    })
  }

  state = { inputs: { token }, multilineInputs: { files }, harness }
  context.ref = ref
  context.sha = sha
  context.repo = repo

  // Cast needed because TypeScript resolves `src` as CommonJS while the test
  // runner evaluates it as ES modules, so the interop shapes differ.
  const module = (await import('../src/run.ts')) as unknown as { default: () => Promise<void> }

  return { run: module.default, harness }
}

/** Arguments of the nth call of a mocked function. */
export function callArgs(fn: ReturnType<typeof mock.fn>, index = 0): unknown[] {
  return fn.mock.calls[index]?.arguments ?? []
}
