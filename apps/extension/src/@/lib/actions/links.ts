import captureScreenshot from '../screenshot.ts';
import { bookmarkFormValues } from '../validators/bookmarkForm.ts';
import axios from 'axios';
// import { bookmarkMetadata } from '../cache.ts';
import { getCurrentTabInfo } from '../utils.ts';

export async function postLink(
  baseUrl: string,
  uploadImage: boolean,
  data: bookmarkFormValues,
  setState: (state: 'capturing' | 'uploading' | null) => void,
  apiKey: string
) {
  const url = `${baseUrl}/api/v1/links`;

  if (uploadImage) {
    setState('capturing');
    const screenshot = await captureScreenshot();
    setState('uploading');

    const link = await axios.post(url, data, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const { id } = link.data.response;
    const archiveUrl = `${baseUrl}/api/v1/archives/${id}?format=0`;

    const formData = new FormData();
    formData.append('file', screenshot, 'screenshot.png');

    await axios.post(archiveUrl, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${apiKey}`,
      },
    });

    setState(null);

    return link;
  } else {
    return await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
    });
  }
}

export async function postLinkFetch(
  baseUrl: string,
  data: bookmarkFormValues,
  apiKey: string
) {
  const url = `${baseUrl}/api/v1/links`;

  return await fetch(url, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
  });
}

export async function updateLinkFetch(
  baseUrl: string,
  id: number,
  data: bookmarkFormValues,
  apiKey: string
) {
  const url = `${baseUrl}/api/v1/links/${id}`;

  return await fetch(url, {
    method: 'PUT',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
  });
}

export async function deleteLinkFetch(
  baseUrl: string,
  id: number,
  apiKey: string
) {
  const url = `${baseUrl}/api/v1/links/${id}`;

  return await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });
}

// export async function getLinksFetch(
//   baseUrl: string,
//   apiKey: string
// ): Promise<{ response: bookmarkMetadata[] }> {
//   const url = `${baseUrl}/api/v1/links`;
//   const response = await fetch(url, {
//     headers: {
//       Authorization: `Bearer ${apiKey}`,
//     },
//   });
//   return await response.json();
// }

export async function checkLinkExists(
  baseUrl: string,
  apiKey: string
): Promise<boolean> {
  const tabInfo = await getCurrentTabInfo();
  if (!tabInfo.url) {
    console.error('No URL found for current tab');
    return false;
  }

  const url =
    `${baseUrl}/api/v1/search?sort=0&searchQueryString=` +
    encodeURIComponent(`url:${tabInfo.url}`);

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  const { data } = await response.json();

  const exists = !!data && data.links?.length > 0;

  return exists;
}
