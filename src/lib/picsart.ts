export const generateTextToVideoPicsart = async (prompt: string) => {
  const options = {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'X-Picsart-API-Key': 'paat-WNdl7yYf7kEXEd7InCidt7aQOSY'
    },
    body: JSON.stringify({
      width: 1024,
      height: 1024,
      quality: '480p',
      audio: false,
      length: 3,
      model: 'urn:air:wan:model:wan:wan-2.7-text-to-video@1',
      prompt: prompt || 'A beautiful scene'
    })
  };

  const res = await fetch('https://genai-api.picsart.io/v1/text2video', options);
  const data = await res.json();
  return JSON.stringify(data, null, 2);
};

export const generateImageToVideoPicsart = async (imageFile: File, prompt?: string) => {
  const form = new FormData();
  form.append('width', '1024');
  form.append('height', '1024');
  form.append('quality', '480p');
  form.append('audio', 'false');
  form.append('length', '3');
  form.append('model', 'urn:air:wan:model:wan:wan-2.7-image-to-video@1');
  form.append('image', imageFile);
  if (prompt) form.append('prompt', prompt);

  const options = {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'X-Picsart-API-Key': 'paat-WNdl7yYf7kEXEd7InCidt7aQOSY'
    },
    body: form
  };

  const res = await fetch('https://genai-api.picsart.io/v1/image2video', options);
  const data = await res.json();
  return JSON.stringify(data, null, 2);
};

export const generateTextToAudioPicsart = async (text: string) => {
  const options = {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'X-Picsart-API-Key': 'paat-WNdl7yYf7kEXEd7InCidt7aQOSY'
    },
    body: JSON.stringify({
      language: 'en',
      model: 'urn:air:openai:model:openai:tts-1@1',
      text: text || 'Hello world'
    })
  };

  const res = await fetch('https://genai-api.picsart.io/v1/text2speech', options);
  const data = await res.json();
  return data;
};
