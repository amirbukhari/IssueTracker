"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIssues = exports.createIssue = exports.gitFetch = void 0;
const node_fetch_1 = require("node-fetch");
const GITLAB_ROOT_URL = 'https://gitlab.com/api/v4/projects/26602273';
const PAT = `${process.env.PAT}`;
//  const PAT = 'e43iLkyiYp4-QsCdZtwW';
//const PROD_PAT = 'zYpMtPXAkBqSPWpWFSBV';
const gitFetch = (uri, method = 'GET', data = {}) => __awaiter(void 0, void 0, void 0, function* () {
    const useUri = (uri.startsWith(GITLAB_ROOT_URL)
        ? uri
        : `${GITLAB_ROOT_URL}${uri}`);
    const response = yield node_fetch_1.default(useUri, Object.assign({ method, headers: {
            // Authorization: `Bearer ${await getSavedAccessToken()}`,
            'Content-Type': 'application/json',
            'PRIVATE-TOKEN': PAT,
        } }, (['POST', 'PUT'].includes(method)
        ? { body: JSON.stringify(data) }
        : {})));
    return response;
});
exports.gitFetch = gitFetch;
const createIssue = (title, description) => __awaiter(void 0, void 0, void 0, function* () {
    const encodedTitle = encodeURI(title);
    const encodedDescription = encodeURI(description);
    const response = yield exports.gitFetch(`/issues?title=${encodedTitle}&labels=todo&description=${encodedDescription}`, 'POST');
    const data = JSON.stringify(yield response.json());
    return data;
});
exports.createIssue = createIssue;
const getIssues = () => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield exports.gitFetch('/issues?scope=all&state=opened&per_page=50');
    const data = (yield response.json());
    return data;
});
exports.getIssues = getIssues;
//# sourceMappingURL=gitlabApi.js.map