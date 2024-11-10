import formidable from "formidable";
import { geminiHandler } from "../helpers/gemini";
import { simpletexHandler } from "../helpers/imageToText";

export const config = {
  api: {
    bodyParser: false, // Disable Next.js's body parser to use formidable
  },
};

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    const form = formidable({
        multiples: false, // Only a single file is expected
    });

    form.parse(req, async (err, fields, files) => {
        if (err) {
            return res
            .status(500)
            .json({ message: "File parsing error", error: err.message });
        }
        const file = Array.isArray(files.file) ? files.file[0] : files.file;
        if (!file || !file.filepath) {
          return res.status(400).json({ message: 'No file uploaded or file path is missing' });
        }
        const fileStream = fs.createReadStream(file.filepath);

        let simpletex_response = await simpletexHandler(fileStream, file.originalFilename);
        simpletex_response = 'markdown' in simpletex_response ? simpletex_response['res']['info']['markdown'] : simpletex_response['res']['info'];
        console.log(simpletex_response);

        const system_prompt = "Act as a note-taker for lectures. You will be provided an audio transcript of the lecture, \
        alongside a visual transcription of any slides, equations, or other visual content the teacher is currently presenting.\
        The visual transcription may contain latex expressions or other mathematical notation. Using both the audio and visual transcripts \
        create a note that coherently and cohesively combines the two. Output only the generated note, keeping it clear and concise.";
        
        const { note } = fields;
        console.log(note[0]);

        const gemini_response = await geminiHandler(system_prompt + " Audio transcription: " + note[0] + " Visual transcription: " + simpletex_response);
        console.log("summary: " + gemini_response);
        res.status(200).json({message: gemini_response})
    });
}
