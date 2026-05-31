"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = getReleaseTag;
const github_1 = require("@actions/github");
function getReleaseTag() {
    const { ref } = github_1.context;
    let tag = '';
    if (ref.startsWith('refs/tags/'))
        tag = ref.replace('refs/tags/', '');
    if (!tag.length)
        throw new Error('No release tag found');
    return tag;
}
