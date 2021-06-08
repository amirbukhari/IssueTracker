import { Hash } from '@jamesgmarks/utilities';
import fetch from 'node-fetch';

const GITLAB_ROOT_URL = 'https://gitlab.com/api/v4/projects/23918468';
// const PAT = 'e43iLkyiYp4-QsCdZtwW';
const PROD_PAT = 'zYpMtPXAkBqSPWpWFSBV';
export const gitFetch = async (uri: string, method: 'GET' | 'POST' | 'PUT' = 'GET', data: Hash = {}) => {
  const useUri = (
    uri.startsWith(GITLAB_ROOT_URL)
      ? uri
      : `${GITLAB_ROOT_URL}${uri}`
  );
  const response = await fetch(
    useUri,
    {
      method,
      headers: {
        // Authorization: `Bearer ${await getSavedAccessToken()}`,
        'Content-Type': 'application/json',
        'PRIVATE-TOKEN': PROD_PAT,
      },
      ...(
        ['POST', 'PUT'].includes(method)
          ? { body: JSON.stringify(data) }
          : {}
      ),
    },
  );

  return response;
};

export const createIssue = async (title: string, description: string) => {
  const encodedTitle = encodeURI(title);
  const encodedDescription = encodeURI(description);
  const response = await gitFetch(
    `/issues?title=${encodedTitle}&labels=todo&description=${encodedDescription}`, 'POST',
  );
  const data = JSON.stringify(await response.json());
  return data;
};

export const getIssues = async () => {
  const response = await gitFetch('/issues?scope=all&state=opened&per_page=50');
  const data = (await response.json());
  return data;
};
