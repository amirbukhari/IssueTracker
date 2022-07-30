import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { window, workspace } from 'vscode';

// import { createIssue } from './gitlabApi';

const issueOutput = window.createOutputChannel('IssueTrackerHelper');

const settings = workspace.getConfiguration('issueTracker');

const determineFileType = (file: string) => {
  const fileTypes: string[] = settings.get('fileTypes') ?? [];
  const fileType = fileTypes.find((fileType) => file.includes(fileType))
  return fileType
}

export const getAllFiles = (dirPath: string): string[] => {

  const foldersToIgnore: string[] = settings.get('foldersToIgnore') ?? [];
  const directory = fs.readdirSync(dirPath);
  const pathFromWorkspaceRoot = dirPath.replace(workspace.rootPath ?? '', '');

  return directory.reduce<string[]>((acc, file) => {
    //Folder Logic
    const isFolder: boolean = fs.statSync(`${dirPath}/${file}`).isDirectory();
    const isFolderToIgnore: boolean = isFolder ? foldersToIgnore.includes(`.${pathFromWorkspaceRoot}/${file}`) : false
    const filesInFolder = isFolder && !isFolderToIgnore ? getAllFiles(`${dirPath}/${file}`) : [];

    //File Logic
    const fileType = determineFileType(file);
    const isFileToParse = !isFolder && !!fileType;
    const filePath = isFileToParse ? [path.join(dirPath, '/', file)] : []

    return [
      ...acc,
      ...filesInFolder,
      ...filePath
    ]
  }, [])
};


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