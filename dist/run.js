"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = run;
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
// Local imports
const release_ts_1 = __importDefault(require("./release.js"));
async function run() {
    try {
        const files = core.getMultilineInput('files', { required: true });
        const token = core.getInput('token', { required: true });
        const octokit = github.getOctokit(token);
        const releaseTag = (0, release_ts_1.default)();
        core.debug(`Resolved release tag to ${releaseTag}`);
        const releases = await octokit.rest.repos.listReleases({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo
        });
        if (releases.data.some((release) => release.tag_name === releaseTag)) {
            core.warning(`Release with tag ${releaseTag} already exists`);
            return;
        }
        const release = await octokit.rest.repos.createRelease({
            draft: true,
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            tag_name: releaseTag,
            target_commitish: github.context.sha
        });
        await Promise.all(files.map(async (file) => {
            core.debug(`Reading file ${file}`);
            const fileName = (0, node_path_1.basename)(file);
            const data = await (0, promises_1.readFile)(file);
            core.debug(`Uploading file ${fileName} (${data.length} bytes)`);
            const upload = await octokit.rest.repos.uploadReleaseAsset({
                data: data,
                name: fileName,
                owner: github.context.repo.owner,
                release_id: release.data.id,
                repo: github.context.repo.repo
            });
            core.info(`Uploaded file ${fileName}, permalink is: ${upload.data.browser_download_url}`);
        }));
    }
    catch (error) {
        if (error instanceof Error)
            core.setFailed(error.message);
        else
            core.setFailed('Unknown error');
    }
}
