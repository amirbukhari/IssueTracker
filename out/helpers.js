"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllFiles = void 0;
const fs = require("fs");
const path = require("path");
const vscode_1 = require("vscode");
// import { createIssue } from './gitlabApi';
const issueOutput = vscode_1.window.createOutputChannel('IssueTrackerHelper');
const settings = vscode_1.workspace.getConfiguration('issueTracker');
const determineFileType = (file) => {
    var _a;
    const fileTypes = (_a = settings.get('fileTypes')) !== null && _a !== void 0 ? _a : [];
    const fileType = fileTypes.find((fileType) => file.includes(fileType));
    return fileType;
};
const getAllFiles = (dirPath) => {
    var _a, _b;
    const foldersToIgnore = (_a = settings.get('foldersToIgnore')) !== null && _a !== void 0 ? _a : [];
    const directory = fs.readdirSync(dirPath);
    const pathFromWorkspaceRoot = dirPath.replace((_b = vscode_1.workspace.rootPath) !== null && _b !== void 0 ? _b : '', '');
    return directory.reduce((acc, file) => {
        //Folder Logic
        const isFolder = fs.statSync(`${dirPath}/${file}`).isDirectory();
        const isFolderToIgnore = isFolder ? foldersToIgnore.includes(`.${pathFromWorkspaceRoot}/${file}`) : false;
        const filesInFolder = isFolder && !isFolderToIgnore ? exports.getAllFiles(`${dirPath}/${file}`) : [];
        //File Logic
        const fileType = determineFileType(file);
        const isFileToParse = !isFolder && !!fileType;
        const filePath = isFileToParse ? [path.join(dirPath, '/', file)] : [];
        return [
            ...acc,
            ...filesInFolder,
            ...filePath
        ];
    }, []);
};
exports.getAllFiles = getAllFiles;
// non functional approach to getting all files
// export const getAllFiles = (dirPath: string, arrayOfFiles: string[]) => {
//   const foldersToIgnore: string[] = settings.get('foldersToIgnore') ?? [];
//   const files = fs.readdirSync(dirPath);
//   const pathFromWorkspaceRoot = dirPath.replace(workspace.rootPath ?? '', '');
//   let _arrayOfFiles = arrayOfFiles || [];
//   files.forEach((file) => {
//     if (fs.statSync(`${dirPath}/${file}`).isDirectory()) {
//       issueOutput.appendLine(`.${pathFromWorkspaceRoot}/${file}`);
//       _arrayOfFiles = (
//         !foldersToIgnore.includes(`.${pathFromWorkspaceRoot}/${file}`)
//           ? getAllFiles(`${dirPath}/${file}`, _arrayOfFiles)
//           : _arrayOfFiles
//       );
//     } else if (file.includes('.ts')) {
//       issueOutput.appendLine(`.${pathFromWorkspaceRoot}/${file}`);
//       _arrayOfFiles.push(path.join(dirPath, '/', file));
//     }
//   });
//   return arrayOfFiles;
// };
//# sourceMappingURL=helpers.js.map