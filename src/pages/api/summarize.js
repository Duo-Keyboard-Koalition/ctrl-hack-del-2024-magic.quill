import formidable from "formidable";
import geminiHandler from "./gemini";
import simpletexHandler from "./imageToText";
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false, // Disable Next.js's body parser to use formidable
  },
};

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }
    console.log('summ')

    const form = formidable({
        // multiples: false, // Only a single file is expected
    });

    form.parse(req, async (err, fields, files) => {
        if (err) {
            return res
            .status(500)
            .json({ message: "File parsing error", error: err.message });
        }
        const file = Array.isArray(files.file) ? files.file[0] : files.file;
        console.log(file);
        if (!file || !file.filepath) {
            console.log('parsing')
            const { note } = fields;

            const system_prompt = "Act as a note-taker for lectures. You will be provided an audio transcript of the lecture, \
            alongside a visual transcription of any slides, equations, or other visual content the teacher is currently presenting.\
            The visual transcription may contain latex expressions or other mathematical notation. Using both the audio and visual transcripts \
            create a note that coherently and cohesively combines the two. Should the the content contain any information that would be more intuitively \
            represented as a chart (such as flow charts - recall that mermaid flowcharts should start with the word 'flowchart'. Also insert ), generate a mermaid js chart for this information. Surround the chart with ```mermaid   ```` Output only the generated note, keeping it clear and concise.";
            
            let gemini_response = await geminiHandler(system_prompt + " Audio transcription: " + note[0] + " Visual transcription: ");
            console.log("summary: " + gemini_response);

            const mermaidChartMatch = gemini_response.match(/```mermaid([\s\S]*?)```/);
            const mermaidChart = mermaidChartMatch ? mermaidChartMatch[1].replace(/```mermaid[\s\S]*?```/, '').trim() : '';
            console.log(mermaidChart);

            gemini_response = gemini_response.replace(/```mermaid[\s\S]*?```/, '');

            res.status(200).json({message: gemini_response, flowchart: mermaidChart})
        } else {
            // if (!file || !file.filepath) {
            //   return res.status(400).json({ message: 'No file uploaded or file path is missing' });
            const fileStream = fs.createReadStream(file.filepath);

            let simpletex_response = await simpletexHandler(fileStream, file.originalFilename);
            simpletex_response = 'markdown' in simpletex_response ? simpletex_response['res']['info']['markdown'] : simpletex_response['res']['info'];
            console.log(simpletex_response);

            const system_prompt = "Act as a note-taker for lectures. You will be provided an audio transcript of the lecture, \
            alongside a visual transcription of any slides, equations, or other visual content the teacher is currently presenting.\
            The visual transcription may contain latex expressions or other mathematical notation. Using both the audio and visual transcripts \
            create a note that coherently and cohesively combines the two. Should the the content contain any information that would be more intuitively \
            represented as a chart (such as flow charts - recall that mermaid flowcharts should start with the word 'flowchart'. Also insert ), generate a mermaid js chart for this information. Surround the chart with ```mermaid   ```` Output only the generated note, keeping it clear and concise.";
            
            const { note } = fields;
            console.log(note[0]);

            let gemini_response = await geminiHandler(system_prompt + " Audio transcription: " + note[0] + " Visual transcription: " + simpletex_response);
            console.log("summary: " + gemini_response);

            const mermaidChartMatch = gemini_response.match(/```mermaid([\s\S]*?)```/);
            const mermaidChart = mermaidChartMatch ? mermaidChartMatch[1].replace(/```mermaid[\s\S]*?```/, '').trim() : '';
            console.log(mermaidChart);

            gemini_response = gemini_response.replace(/```mermaid[\s\S]*?```/, '');

            res.status(200).json({message: gemini_response, flowchart: mermaidChart})
        }
    });
}
