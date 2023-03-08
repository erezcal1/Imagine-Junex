import { EntityKind, MeasureModel, MusicModel, NoteModel, PartModel, ScoreModel } from './scoreModel';
import { CommonHelper } from '../services/commonHelper';
import { MusicalHelper } from '../services/musicalHelper';
import { Part } from './part';

export class Note implements NoteModel {
	kind: EntityKind = EntityKind.NOTE;

	constructor(
		public id: string,
		public measureId: string,
		public partId: string,
		public fullName: string,
		public isRest: boolean,
		public startDiv: number,
		public durationDivs: number,
		public isTiedToNext: boolean,
		public isTiedToPrev: boolean,
	) {}

	static createFromModel(n: NoteModel) {
		return new Note(n.id, n.measureId, n.partId, n.fullName, n.isRest, n.startDiv, n.durationDivs, n.isTiedToNext, n.isTiedToPrev);
	}

	static toggleAlter(n: NoteModel, useSharps: boolean) {
		const noteDetails = MusicalHelper.parseNote(n.fullName);
		if (!noteDetails.alter) {
			return;
		}
		if ((noteDetails.alter === '#' && useSharps) || (noteDetails.alter === 'b' && !useSharps)) {
			return;
		}
		n.fullName = MusicalHelper.toggleSharpAndFlat(n.fullName);
	}

	static resetIds(n: NoteModel, measureId: string, partId: string) {
		n.id = CommonHelper.getRandomId();
		n.measureId = measureId;
		n.partId = partId;
	}

	static untieNextNote(note: NoteModel, score: ScoreModel) {
		const { measures } = score.music;
		// find the note's measure index
		const measureIdx = measures.findIndex((m) => m.id === note.measureId);
		// use it to find the note's part index
		const partIdx = measures[measureIdx].parts.findIndex((p) => p.id === note.partId);
		// find the parallel part in the next measure, and set isTied to false
		// oddly satisfying
		measures[measureIdx + 1].parts[partIdx].notes[0].isTiedToPrev = false;
	}

	// todo: I might just take the score as the parameter instead of all these.. But on second thought this solution may take less looping around
	static addTiedNote(note: NoteModel, part: PartModel, measure: MeasureModel, music: MusicModel, tiedDivs: number) {
		// find the index of the selected part, for a reference in the next measure
		const partIdx = measure.parts.findIndex((p) => p.id === part.id);
		// run through the score to get the next measure, and then get the part of the same index
		const nextMeasureIdx = music.measures.findIndex((m) => m.id === measure.id) + 1;
		const nextPart = music.measures[nextMeasureIdx].parts[partIdx];
		// define the first note of the corresponding part and set it's duration
		const { beatDurationDivs } = MusicalHelper.parseTimeSignature(measure.timeSignature);

		const tiedNote = new Note(CommonHelper.getRandomId(), nextPart.measureId, nextPart.id, note.fullName, false, 0, beatDurationDivs, false, true);
		note.isTiedToNext = true;
		tiedNote.isTiedToPrev = true;
		nextPart.notes[0] = tiedNote;
		if (tiedDivs !== beatDurationDivs) Part.changeNoteDuration(nextPart, nextPart.notes[0].id, tiedDivs, measure, music, false);
	}
}
