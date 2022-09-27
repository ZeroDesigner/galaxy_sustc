import axios from "axios";
import { getAppRoot } from "onload/loadConfig";
import { rethrowSimple } from "utils/simple-error";
import { plugins, Cite } from "@citation-js/core";
import "@citation-js/plugin-bibtex";
import "@citation-js/plugin-csl";

plugins.config.get("@bibtex");
plugins.config.get("@csl");

export async function getCitations(source, id) {
    try {
        const request = await axios.get(`${getAppRoot()}api/${source}/${id}/citations`);
        const rawCitations = request.data;
        const citations = [];
        for (const rawCitation of rawCitations) {
            try {
                const cite = new Cite(rawCitation.content);
                citations.push({ raw: rawCitation.content, cite: cite });
            } catch (err) {
                console.warn(`Error parsing bibtex: ${err}`);
            }
        }
        return citations;
    } catch (e) {
        rethrowSimple(e);
    }
}

export function formattedCitation(citation) {}
