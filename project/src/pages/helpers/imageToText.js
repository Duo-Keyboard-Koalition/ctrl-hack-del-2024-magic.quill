import axios from 'axios';
import FormData from 'form-data';

export async function simpletexHandler(fileStream, filename) {
  const SIMPLETEX_API_TOKEN = process.env.SIMPLETEX_API_TOKEN;
  const apiUrl = "https://server.simpletex.cn/api/simpletex_ocr";

  const formData = new FormData();
  formData.append("file", fileStream, filename);
  const response = await axios.post(apiUrl, formData, {
    headers: {
      ...formData.getHeaders(),
      token: SIMPLETEX_API_TOKEN,
    },
  });

  return response.data;
}
