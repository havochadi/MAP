import type { LevelCurriculum } from "./types";

export const englishCurriculum: LevelCurriculum[] = [
  {
    level: "P1",
    topics: [
      {
        title: "Oracy: Listening to Stories and Simple Show-and-Tell",
        strand: "Oracy",
        description:
          "Pupils listen to a story read aloud and answer simple who/what/where questions, then practise short show-and-tell turns about a familiar object or event. Keep prompts concrete and let pupils use gestures and single words before full sentences.",
        conceptExplanation:
          "Oracy at this level means two connected skills: understanding spoken language (listening) and producing it (speaking) in short, simple bursts. Listening comprehension is checked through very concrete who/what/where questions because pupils this age can identify facts stated directly but cannot yet infer. Show-and-tell builds the foundation of spoken narrative — describing something in a logical order (what it is, then a detail about it) — which is the same underlying skill pupils will later use for oral exams and storytelling. The goal isn't grammatical perfection yet; it's pupils becoming comfortable producing connected spoken language in front of others.",
        workedExamples: [
          {
            problem:
              "A tutor reads aloud: 'Tom saw a red kite in the sky. He wanted to fly it too.' Ask: Who saw the kite? What colour was the kite?",
            solution: [
              "'Who saw the kite?' is a literal who-question — the answer 'Tom' is stated directly in the first sentence, so pupils just need to locate and repeat the name.",
              "'What colour was the kite?' is a literal what-question — the answer 'red' is also stated directly, testing whether the pupil was listening for detail, not just the main character.",
              "Both questions are literal, not inferential, because the answer is a single word taken straight from the text — the right question type for P1, where pupils are still building basic listening attention.",
            ],
          },
          {
            problem: "Model show-and-tell for a toy car: 'This is my car. It is red. It goes very fast.'",
            solution: [
              "Sentence 1 names the object ('This is my car') — the minimum starting point every pupil should be able to produce.",
              "Sentence 2 adds one describing detail (colour) — the first 'elaboration' step pupils are pushed toward once they can manage sentence 1 alone.",
              "Sentence 3 adds a second, different kind of detail (what it does) — showing pupils elaboration can come from multiple angles, not just repeating colour every time.",
            ],
          },
        ],
        teachingSteps: [
          "Read a short, simple picture book aloud, pausing to point at illustrations and ask 'What do you see?'",
          "Ask 2-3 literal who/what/where questions right after, accepting single-word or gestured answers at first.",
          "Model a short show-and-tell yourself first ('This is my pencil. It is blue.') so pupils see the expected pattern.",
          "Have each pupil bring or point to a familiar object and say one to two sentences about it, prompting with 'What is it? What colour is it?' if they freeze.",
          "Give specific praise ('You told me the colour AND the size!') to reinforce elaborating beyond one word.",
        ],
      },
      {
        title: "Phonics and Word Recognition",
        strand: "Reading and Viewing",
        description:
          "Builds letter-sound knowledge and blending so pupils can decode simple CVC and CVCC words, alongside a bank of high-frequency sight words. Use phonics drills briefly at the start of every session — this is the single biggest lever for reading fluency at this level.",
        conceptExplanation:
          "Phonics is the relationship between letters (graphemes) and the sounds they represent (phonemes); 'blending' is saying those sounds in sequence fast enough that they merge into a recognisable word. A CVC word (consonant-vowel-consonant, like 'cat') has exactly three sounds and is the simplest possible blending unit, which is why it's the starting point. High-frequency sight words (like 'the', 'was', 'said') are taught separately because many don't follow regular phonics rules and must be recognised on sight rather than sounded out. Fluent reading later depends on this decoding becoming automatic, so speed matters alongside accuracy.",
        workedExamples: [
          {
            problem: "Blend the word 'cat' using the sounds c-a-t.",
            solution: [
              "Say each sound separately and slowly: /c/ /a/ /t/.",
              "Say the same three sounds again, slightly faster and closer together: /ca/ /t/.",
              "Merge them into one word at normal speaking speed: 'cat'.",
              "Confirm it's a real, recognisable word — if a pupil blends into something that isn't a word, one sound was likely said wrong, not that blending itself failed.",
            ],
          },
          {
            problem: "Sort these into 'can be sounded out' and 'must be memorised as a sight word': cat, was, sit, the.",
            solution: [
              "'cat' — regular CVC, sounds out cleanly as /c/ /a/ /t/ → sound-it-out word.",
              "'sit' — regular CVC, sounds out cleanly as /s/ /i/ /t/ → sound-it-out word.",
              "'was' — sounded out literally it would sound like 'wass', not the real pronunciation 'wuz' → sight word, must be memorised.",
              "'the' — the vowel sound doesn't match a standard short-vowel pattern → sight word, must be memorised.",
            ],
          },
        ],
        teachingSteps: [
          "Warm up with a quick review of 3-4 letter sounds already taught, using flashcards or a simple action for each sound.",
          "Introduce or revisit one new letter-sound pairing, having pupils say the sound aloud several times.",
          "Model blending slowly (c-a-t), then faster (cat), before asking pupils to try blending the same word themselves.",
          "Practise blending 4-5 CVC or CVCC words together as a group, then have pupils attempt 2-3 on their own.",
          "Mix in 3-4 already-banked high-frequency sight words as a quick-fire flashcard round.",
          "Close by having pupils read a short list or simple sentence combining the phonics pattern and sight words just practised.",
        ],
      },
      {
        title: "Shared Reading of Big Books and Simple Sentences",
        strand: "Reading and Viewing",
        description:
          "Follows MOE's Shared Book Approach: read a large-format picture book together, pointing to words as you read, then re-read key sentences with pupils joining in. Ask simple literal questions ('What did the cat do?') to check basic comprehension.",
        conceptExplanation:
          "Shared reading is MOE's Shared Book Approach: the tutor and pupils read the same large, visible text together, with the tutor modelling fluent reading (pace, phrasing, expression) while pupils follow along and progressively join in on parts they know. This differs from independent reading because the pupil isn't decoding alone — they're absorbing what fluent reading sounds like and building a bank of words and sentence patterns recognised on sight from repeated exposure. Literal comprehension questions ('What did the cat do?') are used because the goal at this stage is confirming pupils are tracking the story, not yet analysing it.",
        workedExamples: [
          {
            problem: "During shared reading of 'The cat sat on the mat. The cat saw a rat.' — ask 'What did the cat see?'",
            solution: [
              "Locate the second sentence, which is where new information about the cat's actions appears.",
              "Identify the object noun following 'saw' — 'a rat'.",
              "Answer using the text's own words: 'The cat saw a rat' — at this level, echoing the text's sentence pattern builds familiarity, not just fact recall.",
            ],
          },
          {
            problem: "A pupil says 'sat' when the text says 'mat' during shared re-reading — how does the tutor respond?",
            solution: [
              "Point to the actual word 'mat' and say it clearly, without criticising the guess.",
              "Ask the pupil to compare the word's first letter ('m') to the sound they said ('s') — this builds the habit of checking against print, not guessing from memory.",
              "Have the pupil re-read the corrected word in the full sentence so the fix is reinforced in context.",
            ],
          },
        ],
        teachingSteps: [
          "Show the cover of the big book and ask pupils to predict what it might be about from the picture and title.",
          "Read the whole book aloud once without stopping, pointing to each word as you say it.",
          "Re-read key pages, inviting pupils to join in on repeated or predictable phrases.",
          "Pause on 2-3 pages to ask simple literal questions, pointing back at the text to show exactly where the answer comes from.",
          "Re-read one or two simple sentences together, then have pupils point to and read individual words they recognise.",
        ],
      },
      {
        title: "Writing Simple Sentences",
        strand: "Writing and Representing",
        description:
          "Pupils copy and then independently write short sentences with correct capitalisation and a full stop, often built from a sentence starter or word bank. Watch for reversed letters (b/d) and spacing between words, both common at this stage.",
        conceptExplanation:
          "A simple written sentence needs three fixed things a P1 pupil learns as a pattern: a capital letter at the start, a complete thought (usually a subject plus what it's doing, like 'The dog runs'), and a full stop at the end. Sentence starters and word banks exist because generating an entire sentence from nothing is a heavy load at this age — giving pupils a partial structure ('I like ___') lets them focus on the one new piece (word choice or spelling) instead of everything at once. Letter reversals (b/d, p/q) are a normal developmental stage caused by the letters being mirror images, not a sign of a reading problem.",
        workedExamples: [
          {
            problem: "Use the sentence starter 'I like ___' and the word bank (dog, cake, ball) to write a complete sentence.",
            solution: [
              "Choose one word from the bank, e.g. 'dog'.",
              "Slot it into the starter: 'I like dog' — check if it needs an article, since 'I like the dog' sounds more natural, so revise to that.",
              "Add the capital letter at the very start and the full stop at the end: 'I like the dog.'",
              "Check spacing — there must be a clear gap between every word, worth checking as its own separate step at this level.",
            ],
          },
          {
            problem: "A pupil writes 'the dog run' — what's missing and how is it fixed?",
            solution: [
              "Check the start: 'the' should be capitalised since it's the first word → 'The dog run'.",
              "Check the end: there's no full stop → 'The dog run.'",
              "Subject-verb agreement ('dog run' should be 'dog runs') is a stretch goal at P1, not a required fix — capitalisation and the full stop are the two non-negotiables at this stage.",
            ],
          },
        ],
        teachingSteps: [
          "Show a model sentence built from a sentence starter or word bank pupils can draw from.",
          "Read the model sentence aloud together, pointing out the capital letter at the start and the full stop at the end.",
          "Have pupils copy the model sentence first, checking their capitalisation and word spacing as they write.",
          "Guide pupils to write one similar sentence of their own, substituting a word from the word bank.",
          "Check each pupil's sentence individually for reversed letters or missing spaces, correcting on the spot.",
          "Have pupils read their own sentence back aloud to check it 'sounds right.'",
        ],
      },
      {
        title: "Grammar in Context: Nouns, Verbs, Adjectives and Articles",
        strand: "Grammar in Context",
        description:
          "Teach nouns, verbs, adjectives, singular/plural forms and the articles a/an/the through the shared text itself, not as isolated worksheet drills — point them out in the sentences pupils just read. Simple present and past tense forms are introduced here too.",
        conceptExplanation:
          "A noun names a person, place, animal or thing (dog, school, Ali); a verb shows an action or state (run, is, has); an adjective describes a noun, usually answering 'what kind?' or 'how many?' (a big dog, three apples); and the articles a/an/the signal a noun is coming, with 'a' before consonant sounds, 'an' before vowel sounds, and 'the' for something specific already known to the listener. Teaching these from the shared text rather than a worksheet list matters because pupils learn a word's job by seeing it working inside a real sentence, not as an abstract label.",
        workedExamples: [
          {
            problem: "In the sentence 'The big dog runs fast,' identify the noun, verb and adjective.",
            solution: [
              "Find the naming word — 'dog' is the noun, since it names an animal.",
              "Find the doing word — 'runs' is the verb, since it shows the dog's action.",
              "Find the describing word — 'big' is the adjective, since it describes what kind of dog.",
              "'fast' also describes the running, but at P1 it's enough to have found the three target word types without introducing adverbs yet.",
            ],
          },
          {
            problem: "Choose a/an/the: '___ apple is on ___ table.'",
            solution: [
              "'apple' starts with a vowel sound, so the article before it is 'an' → 'An apple'.",
              "'table' — if it's a specific table the listener already knows, use 'the'; if it's just any table, 'a' would also work.",
              "Full sentence: 'An apple is on the table.' — the rule check is the sound (not the letter) at the start of the next word, which is why 'an' is used before 'apple' even though the letter itself isn't special.",
            ],
          },
        ],
        teachingSteps: [
          "Return to a sentence from the shared text just read and ask pupils to find the 'doing word' (verb) and the 'naming word' (noun).",
          "Introduce whichever part of speech is new today, giving 2-3 more examples pulled from the same text.",
          "Have pupils sort a small set of word cards into nouns, verbs and adjectives as a hands-on group activity.",
          "Drill a/an/the orally in quick succession ('___ apple, ___ dog, ___ sun'), correcting choice, not just pronunciation.",
          "Ask pupils to build one oral sentence using a noun, a verb and an adjective from the sorted cards.",
        ],
      },
      {
        title: "Introducing Text Types: Recount and Narrative",
        strand: "Reading and Viewing",
        description:
          "Pupils meet their first two text types — a personal recount (retelling something that happened) and a simple narrative with a beginning, middle and end. Help them notice the difference: a recount is true and about them; a narrative can be made up.",
        conceptExplanation:
          "A recount retells events that actually happened, roughly in the order they occurred, usually about the writer's own experience ('what I did'). A narrative tells a story that may be invented, and — unlike a recount — typically has a problem or turning point that gets resolved by the end. The key distinguishing question pupils should learn to ask is: 'Did this really happen to the person telling it, or could it be made up?' This distinction is the first step toward recognising that different text types have different purposes and structures, a skill that keeps expanding through every later text type pupils meet.",
        workedExamples: [
          {
            problem:
              "Is this a recount or a narrative? 'Yesterday I went to the zoo with my family. We saw elephants and monkeys. I ate ice cream.'",
            solution: [
              "Check if it's about something that really happened to the speaker — yes, it uses 'I' and describes a specific day's events.",
              "Check for a problem/resolution structure — there isn't one; it's just a sequence of things that happened.",
              "Conclusion: this is a recount, because it is true, personal, and simply retells events in order without a story problem.",
            ],
          },
          {
            problem:
              "Is this a recount or a narrative? 'Once there was a rabbit who lost his way home. A kind owl showed him the path, and he made it home safely.'",
            solution: [
              "Check if it's true and personal — no, it starts with 'Once there was,' a classic story-opening signal, about a talking-animal scenario that isn't a real personal experience.",
              "Check for a problem/resolution — yes: the problem is the rabbit being lost, and the resolution is the owl helping him get home.",
              "Conclusion: this is a narrative, because it has a made-up scenario with a clear problem that gets resolved.",
            ],
          },
        ],
        teachingSteps: [
          "Read a very short recount aloud and ask pupils what makes it true and about something real.",
          "Read a very short narrative and ask pupils what's different — could this really have happened?",
          "Build a simple two-column chart together sorting features (true/made-up, tells what happened to me, has a problem) under Recount vs Narrative.",
          "Give pupils 2-3 short texts and have them decide, with a reason, which type each one is.",
          "Have pupils orally tell one true recount of something they did yesterday, and name it as that text type.",
        ],
      },
    ],
  },
  {
    level: "P2",
    topics: [
      {
        title: "Oracy: Structured Conversations and Retelling",
        strand: "Oracy",
        description:
          "Pupils retell a story in their own words in the correct sequence and take part in short structured conversations (asking and answering follow-up questions, not just one-word replies). Model turn-taking explicitly — many pupils still need this scaffolded.",
        conceptExplanation:
          "Retelling means reconstructing a story's events in the correct order using the pupil's own words, not memorised lines — this proves genuine comprehension rather than recitation, and sequence words (first, then, next, finally) are the scaffold that keeps the retelling in order. A 'structured conversation' at this level means moving beyond a single question-answer exchange into a short back-and-forth: one person's answer prompts a genuine follow-up question from the other, rather than the conversation ending after one reply. This is the foundation of real dialogue, which pupils will need for every later oral and discussion task.",
        workedExamples: [
          {
            problem: "Retell this story in order: 'A boy lost his ball. He looked under the bed. Then he found it in the garden.'",
            solution: [
              "Identify the three events in the original order: lost the ball, looked under the bed, found it in the garden.",
              "Attach a sequence word to each: 'First, a boy lost his ball. Then, he looked under the bed. Finally, he found it in the garden.'",
              "Check the retelling uses the pupil's own phrasing where possible, not a word-for-word copy — e.g. 'a boy' could become 'the boy' consistently, showing understanding rather than memorisation.",
            ],
          },
          {
            problem: "Model a structured conversation starting from: 'I like football.'",
            solution: [
              "Accept the first statement, then ask a genuine follow-up: 'Why do you like football?'",
              "Listen to the answer (e.g. 'Because I can play with my friends') and ask a second follow-up building on THAT answer specifically: 'Which friends do you play with?'",
              "Notice the pattern: each question responds to what was just said, rather than moving to an unrelated new question — this is what makes it a 'conversation' rather than an interview.",
            ],
          },
        ],
        teachingSteps: [
          "Read a short story and immediately model retelling it yourself using sequence words (first, then, next, finally).",
          "Have pupils retell the same story in pairs, prompting with the sequence words if they skip a step.",
          "Model a short conversation with one pupil, deliberately asking a follow-up question after their first answer.",
          "Pair pupils up to practise a similar exchange, coaching them to ask 'why' or 'what happened next' rather than moving on after one reply.",
          "Have 2-3 pairs perform their conversation for the group, giving specific feedback on turn-taking.",
        ],
      },
      {
        title: "Reading and Viewing: Recount and Descriptive Texts",
        strand: "Reading and Viewing",
        description:
          "Extends into descriptive texts (describing a person, place or thing) alongside recounts, using MOE's Modified Language Experience Approach — pupils help generate a shared class text before reading similar published texts. Focus comprehension checks on sequencing and simple detail.",
        conceptExplanation:
          "A descriptive text's job is to paint a picture in the reader's mind using specific sensory and observable details, rather than to tell what happened in order like a recount does. The Modified Language Experience Approach works because pupils comprehend their OWN generated language most easily — by first co-creating a class text from their shared experience, then meeting a professionally published text on a similar topic, pupils bridge from something they already fully understand to something new but structurally familiar. Descriptive detail at this level means concrete, specific words (not just 'nice' or 'big') that let a reader picture, hear or feel the thing being described.",
        workedExamples: [
          {
            problem: "Turn this vague description into a more descriptive one: 'The garden was nice.'",
            solution: [
              "Identify what makes 'nice' vague — it doesn't tell the reader anything specific to picture.",
              "Ask a sense-based question: what could you SEE, SMELL or HEAR in this garden?",
              "Replace the vague word with specific detail: 'The garden was full of bright red flowers and buzzing bees.'",
              "Check the new sentence lets a reader picture something concrete, which 'nice' never could.",
            ],
          },
          {
            problem: "Sequence these recount sentences in the correct order and identify the detail question each answers: 'We got wet in the rain.' / 'We walked to the park.' / 'It started to rain.'",
            solution: [
              "Find the first event logically — you must walk to the park before anything else can happen there: 'We walked to the park.'",
              "Find what happens next in the park: 'It started to rain.'",
              "Find the resulting detail: 'We got wet in the rain.'",
              "Correct order: 'We walked to the park. It started to rain. We got wet in the rain.' — each sentence answers 'what happened next,' the core recount comprehension question.",
            ],
          },
        ],
        teachingSteps: [
          "Have pupils co-generate a short shared class recount (e.g. from a recent class event), with you scribing their spoken sentences.",
          "Read the class-generated text back together, checking it makes sense in order.",
          "Introduce a short published descriptive text on a similar topic and read it aloud, pointing out descriptive words.",
          "Ask sequencing questions on a recount ('What happened first? What happened after that?') and detail questions on the descriptive text ('What colour was it? How did it feel?').",
          "Have pupils highlight or underline 2-3 descriptive words in the published text and explain what picture each word creates.",
        ],
      },
      {
        title: "Writing and Representing: Guided Composition",
        strand: "Writing and Representing",
        description:
          "Pupils write short guided compositions (4–6 sentences) using picture prompts, sentence starters and a word bank, moving from copying toward original sentences. Praise attempts at original vocabulary even when spelling is imperfect — invented spelling is expected at this stage.",
        conceptExplanation:
          "A guided composition sits between fully-scaffolded copying and fully independent writing: pupils generate their own sentence content and word choices, but within a supportive structure (a picture to describe, sentence starters, a word bank) that removes the burden of inventing everything from a blank page. 'Invented spelling' — writing a word the way it sounds even if the spelling is wrong (e.g. 'frend' for 'friend') — is a genuine developmental stage where a pupil is applying real phonics knowledge, and should be treated as progress, not simply marked wrong, since penalising it too early discourages pupils from attempting unfamiliar words at all.",
        workedExamples: [
          {
            problem: "Using a picture of a birthday party and the word bank (cake, balloons, happy, friends), write 2 sentences.",
            solution: [
              "Look at the picture and choose one clear detail to describe first: 'There is a big cake.'",
              "Pick a second word bank item and build a new sentence, this time trying an original word not in the bank if the pupil can attempt it (e.g. 'colourful' for the balloons): 'The colourful balloons are everywhere.'",
              "Check both sentences have a capital letter and full stop, and that spelling attempts (even if imperfect, like 'colrful') are praised for the correct sound-to-letter attempt, not marked as simply wrong.",
            ],
          },
          {
            problem: "A pupil's independent sentence reads: 'My frend is hapy.' How should a tutor respond?",
            solution: [
              "Read the sentence's intended meaning first — 'My friend is happy' — confirming the pupil successfully communicated a real idea.",
              "Praise the invented spellings specifically: 'frend' correctly captures every sound in 'friend,' and 'hapy' captures the sounds in 'happy' — both show real phonics thinking, not carelessness.",
              "Model the correct spelling alongside the pupil's version rather than simply crossing it out, so the pupil sees the correction without the attempt feeling punished.",
            ],
          },
        ],
        teachingSteps: [
          "Show a picture prompt and brainstorm 5-6 words or phrases pupils could use, listing them as a shared word bank.",
          "Model turning 1-2 of the brainstormed ideas into full sentences using a sentence starter.",
          "Have pupils orally rehearse their own sentence with a partner before writing it down.",
          "Guide pupils to write 4-6 sentences about the picture, referring back to the word bank as needed.",
          "Circulate and praise original vocabulary attempts specifically, even where spelling is imperfect.",
          "Have 1-2 pupils read their composition aloud to the group as a model for others.",
        ],
      },
      {
        title: "Grammar in Context: Pronouns, Prepositions and Conjunctions",
        strand: "Grammar in Context",
        description:
          "Introduces pronouns (he/she/it/they), prepositions of place (in/on/under/behind) and simple conjunctions (and/but/because) drawn from the week's reading text. Have pupils swap a repeated noun for a pronoun in their own writing as a quick practical drill.",
        conceptExplanation:
          "A pronoun (he, she, it, they) stands in for a noun already mentioned, so writing doesn't sound repetitive ('Ali went to the shop. Ali bought bread' becomes 'Ali went to the shop. He bought bread'). A preposition of place (in, on, under, behind) tells you WHERE something is relative to something else — it always needs a noun after it to complete the picture (under THE TABLE, not just 'under'). A conjunction (and, but, because) joins two ideas into one sentence, and the choice of conjunction signals the relationship between them: 'and' adds, 'but' contrasts, 'because' explains a reason.",
        workedExamples: [
          {
            problem: "Rewrite to avoid repeating the noun: 'Mei has a cat. Mei feeds Mei's cat every morning.'",
            solution: [
              "Find the repeated noun — 'Mei' appears three times.",
              "Replace the second 'Mei' with the pronoun 'she' (Mei is a girl) and the third with the possessive pronoun 'her'.",
              "Rewritten: 'Mei has a cat. She feeds her cat every morning.' — this sounds smoother and is exactly the fix pupils practise on their own writing.",
            ],
          },
          {
            problem: "Choose the correct conjunction: 'I wanted to play outside ___ it was raining.'",
            solution: [
              "Identify the relationship between the two ideas — wanting to play outside, and rain — these two ideas are in conflict, not simply added together.",
              "'and' would only work if the ideas agreed or simply continued each other, which they don't here.",
              "'but' signals contrast, which correctly captures the conflict: 'I wanted to play outside but it was raining.'",
            ],
          },
        ],
        teachingSteps: [
          "Find a sentence in the week's reading text with a repeated noun and ask pupils how it could be said more smoothly.",
          "Introduce the matching pronoun (he/she/it/they) and practise substituting it into 2-3 more example sentences.",
          "Use classroom objects to physically demonstrate in/on/under/behind, having pupils describe the object's position each time.",
          "Model combining two short sentences with and, but or because, asking pupils which conjunction fits each pair and why.",
          "Have pupils find one repeated noun in a piece of their own writing and rewrite it using a pronoun.",
        ],
      },
      {
        title: "Building Vocabulary Through Shared Texts",
        strand: "Reading and Viewing",
        description:
          "A dedicated word-study slot where pupils collect and use new words met in shared reading, sorting them by meaning or topic. Keep a running class word wall — revisiting it briefly each session does more for retention than a one-off vocabulary list.",
        conceptExplanation:
          "Vocabulary sticks best when a new word is met multiple times, in context, and actually used by the learner — not from a one-off definition list that's never revisited. A word wall works because it turns vocabulary into a cumulative, visible resource: each session both reviews old words (retrieval practice, which strengthens memory) and adds new ones, rather than treating every session's words as disposable. Sorting words by meaning or topic (e.g. all 'feeling words' together) also helps pupils build a mental category system, which makes retrieving the right word later easier than if every word were learned in isolation.",
        workedExamples: [
          {
            problem: "The word 'enormous' appears in this week's text: 'The enormous elephant walked slowly.' Work out its meaning from context.",
            solution: [
              "Look at the surrounding words for clues — 'elephant' is already a large animal, and the sentence is describing its size.",
              "Notice 'enormous' is describing the elephant the same way 'big' would, but the sentence structure suggests something stronger than an ordinary description.",
              "Confirm meaning: 'enormous' means 'very big' — check it by substituting 'very big' into the sentence and confirming it still makes sense: 'The very big elephant walked slowly.'",
            ],
          },
          {
            problem: "Sort these words onto the word wall under the right category: happy, sad, elephant, tiger, excited.",
            solution: [
              "Identify what each word describes — 'happy,' 'sad' and 'excited' all describe feelings; 'elephant' and 'tiger' name animals.",
              "Create or use two categories: 'Feeling words' and 'Animal words'.",
              "Place each word under its category, and have the pupil use one word from each category in a spoken sentence before it's added to the wall permanently.",
            ],
          },
        ],
        teachingSteps: [
          "Revisit the class word wall for 1-2 minutes, having pupils quickly use one word from it in a sentence.",
          "Identify 2-3 new or interesting words from the week's shared text, discussing their meaning using context clues from the text.",
          "Sort the new words into a category on the word wall (e.g. feeling words, action words, topic words).",
          "Have pupils use each new word orally in their own sentence before it's added permanently to the wall.",
          "End with a quick game (e.g. describe a word wall word without saying it) to reinforce the meanings just discussed.",
        ],
      },
      {
        title: "Introducing Expository Text Types",
        strand: "Reading and Viewing",
        description:
          "Pupils meet simple expository (explaining/informational) texts for the first time, such as a short 'how a plant grows' piece, learning to spot facts versus opinions at a basic level. Contrast this explicitly against the narrative and recount texts already covered.",
        conceptExplanation:
          "An expository text's purpose is to explain or inform, not to entertain with a story or retell personal events — it presents facts (things that can be checked and are true for everyone) rather than one person's feelings or judgements. A fact is something that can be proven true ('Plants need water to grow'); an opinion is a personal view that could differ between people ('Plants are the best living thing'). Learning to tell these apart matters because pupils will keep meeting expository texts across every school subject, and confusing fact with opinion is a comprehension error that gets more costly as texts get more persuasive at higher levels.",
        workedExamples: [
          {
            problem: "Is this a fact or an opinion? 'A plant needs sunlight, water and soil to grow.'",
            solution: [
              "Ask: could this be checked and shown true for every plant, regardless of who's looking at it?",
              "Yes — this describes something true and provable about how plants work, not a personal feeling.",
              "Conclusion: this is a fact.",
            ],
          },
          {
            problem: "Is this a fact or an opinion? 'Sunflowers are the prettiest flowers.'",
            solution: [
              "Ask: could this be checked and shown true for everyone, or might different people disagree?",
              "Different people could genuinely disagree about which flower is 'prettiest' — it depends on personal taste.",
              "Conclusion: this is an opinion, signalled by the judgement word 'prettiest'.",
            ],
          },
        ],
        teachingSteps: [
          "Read a short expository text aloud (e.g. 'How a Plant Grows') and ask what it's trying to do — tell a story, or explain something?",
          "Contrast it directly against a narrative or recount pupils already know, listing how it looks and sounds different.",
          "Point out 2-3 clear facts in the text and ask pupils how they know each one is a fact, not just someone's feeling.",
          "Introduce one simple opinion sentence and have pupils explain why it's different from a fact.",
          "Have pupils sort 4-5 mixed sentences into 'fact' and 'opinion' piles as a quick check.",
        ],
      },
    ],
  },
  {
    level: "P3",
    topics: [
      {
        title: "Oracy: Sharing Opinions and Asking Questions",
        strand: "Oracy",
        description:
          "Pupils move beyond retelling to giving a simple opinion with a reason ('I liked the story because...') and asking their own clarifying questions about a text. This is the shift from learning to read to reading to learn — encourage them to talk like a reader, not just answer questions.",
        conceptExplanation:
          "An opinion with a reason has two parts that must both be present: a stated view (what you think) and a justification (why you think it) linked by a word like 'because'. Without the reason, an opinion is just a preference; with it, the pupil is demonstrating actual reasoning about the text, not just a reaction. Asking clarifying questions — genuinely wondering something about the text rather than just answering someone else's question — marks a pupil moving from passive comprehension to active, reader-driven engagement, which is a more sophisticated form of thinking about text than answering literal questions.",
        workedExamples: [
          {
            problem: "Turn this bare opinion into an opinion-with-reason: 'I liked the story.'",
            solution: [
              "Identify that the statement is a bare opinion — it states a view but gives no justification.",
              "Ask 'why?' to prompt the missing reason — e.g. what specifically made the pupil like it.",
              "Add the reason using 'because': 'I liked the story because the fox outsmarted the wolf at the end.'",
              "Check the reason refers to something specific in the text, not a vague restatement like 'because it was good'.",
            ],
          },
          {
            problem: "While reading 'The boy opened the mysterious box slowly,' model a genuine clarifying question.",
            solution: [
              "Notice the word 'mysterious' signals something unexplained that a curious reader would want to know more about.",
              "Form a genuine wondering question rather than a fact-check question: 'I wonder what's inside the box?'",
              "Contrast this with a literal question like 'What did the boy open?' — the wondering question shows active reader engagement, not just comprehension checking.",
            ],
          },
        ],
        teachingSteps: [
          "Model giving your own opinion about a text with a reason ('I liked this story because the ending surprised me').",
          "Have pupils turn to a partner and share their own opinion using the same 'because' structure.",
          "Read a short passage and pause deliberately at a point that invites a genuine question, modelling one yourself ('I wonder why...').",
          "Have pupils generate their own question about the text, writing or saying it before it's answered.",
          "Discuss 2-3 pupil-generated questions as a group, showing that asking good questions is itself a reading skill.",
        ],
      },
      {
        title: "Reading to Learn: Information Reports and Non-Fiction",
        strand: "Reading and Viewing",
        description:
          "Pupils read short non-fiction information reports (animals, places, how things work) and practise pulling out facts under headings — a skill they'll lean on across every subject, not just English. Text length and vocabulary step up noticeably from P2.",
        conceptExplanation:
          "An information report is organised by topic under headings (unlike a narrative, which is organised by time) — each heading signals what kind of facts will follow, and a skilled reader uses headings to predict and locate information before reading every word. 'Reading to learn' means extracting and remembering specific facts for a purpose, rather than 'learning to read,' which is about decoding fluency — this shift matters because it's the reading skill pupils will use in Science, Social Studies and every other subject, not just English lessons. A graphic organiser (a simple chart matching headings to facts) externalises this process so pupils can see they're building organised knowledge, not just reading words.",
        workedExamples: [
          {
            problem:
              "Under the heading 'What Elephants Eat,' the text says: 'Elephants eat grass, leaves, fruit and bark. An adult elephant can eat up to 150 kg of food a day.' State the single most important fact.",
            solution: [
              "Reread the heading first — it tells you this section is specifically about diet, not habitat or appearance.",
              "Scan the sentences for the core fact that answers the heading's question directly.",
              "The most important fact matching the heading is: 'Elephants eat grass, leaves, fruit and bark' — the specific quantity (150 kg) is a supporting detail, not the main fact.",
            ],
          },
          {
            problem: "Predict what a section headed 'Where Elephants Live' will cover, before reading it.",
            solution: [
              "Read only the heading and think about what kind of information it signals — 'where' points to location or habitat, not diet or behaviour.",
              "Predict the section will mention specific places or types of environment (e.g. forests, grasslands, particular countries or continents).",
              "Read the section and check the prediction — confirming or correcting it builds the habit of using headings actively, not just as labels to skip past.",
            ],
          },
        ],
        teachingSteps: [
          "Preview the text's headings and pictures before reading, predicting what each section will cover.",
          "Read one section aloud, then ask pupils to state the single most important fact from it in their own words.",
          "Model recording that fact under the section's heading in a simple graphic organiser.",
          "Have pupils read the next section independently and record 1-2 facts under its heading themselves.",
          "Compare pupils' recorded facts as a group, checking they matched the heading's topic and not a stray detail.",
        ],
      },
      {
        title: "Writing and Representing: Narrative with Simple Plot",
        strand: "Writing and Representing",
        description:
          "Pupils plan and write a short narrative with a clear problem and resolution, using a simple story-mountain or beginning-middle-end planner before drafting. Insist on planning first — pupils who skip straight to writing tend to lose the plot thread halfway through.",
        conceptExplanation:
          "A narrative's plot needs, at minimum, three connected parts: a beginning that sets up a normal situation, a problem that disrupts it, and a resolution that solves the problem — without a genuine problem, a story is just a sequence of events, not a narrative with tension. Planning before drafting matters because holding an entire story's structure in working memory while also managing spelling, sentence construction and handwriting is too much at once; a planner externalises the structure so the pupil only has to focus on one thing (writing well) at a time. A resolution must specifically solve the stated problem — a common error is a story that introduces a problem and then simply stops, or ends with an unrelated event.",
        workedExamples: [
          {
            problem: "Identify the problem and resolution in this model story outline: A girl loses her school bag on the bus. She retraces her journey and finds it left at the bus stop.",
            solution: [
              "Identify the beginning — a normal situation (the girl is travelling somewhere) before anything goes wrong.",
              "Identify the problem — losing the school bag disrupts the normal situation.",
              "Identify the resolution — finding the bag at the bus stop, which directly solves the stated problem, not an unrelated event.",
              "Confirm this counts as a complete narrative because the resolution connects directly back to the specific problem raised, closing the loop.",
            ],
          },
          {
            problem: "Plan a story problem and resolution for the story-starter: 'It was the day of the school sports carnival.'",
            solution: [
              "Choose a problem that could plausibly disrupt this specific situation — e.g. the pupil wakes up with a hurt ankle on the morning of the race.",
              "Check the problem creates real tension — does it put something the character wants (winning, or just competing) at risk? Yes.",
              "Plan a resolution that directly solves THAT problem — e.g. the pupil finds another way to contribute (cheering the team on, helping as a scorer) rather than a resolution unrelated to the ankle injury.",
              "Confirm beginning, problem and resolution connect logically before any drafting begins.",
            ],
          },
        ],
        teachingSteps: [
          "Read a short model narrative and identify its problem and resolution together on a simple story-mountain diagram.",
          "Brainstorm 2-3 possible problems pupils could use for their own story, discussing what a believable resolution might look like for each.",
          "Have pupils complete their own beginning-middle-end planner before writing a single sentence of the story itself.",
          "Check each pupil's planner individually, asking 'so what's the problem, and how does it get solved?' before they draft.",
          "Guide pupils through drafting the beginning and middle in one sitting, referring back to the planner at each stage.",
          "Have pupils write the resolution last, checking it actually solves the problem they planned.",
        ],
      },
      {
        title: "Grammar in Context: Tenses and Sentence Combining",
        strand: "Grammar in Context",
        description:
          "Reinforces consistent tense use across a piece of writing (a common weak point) and introduces combining two short sentences with a conjunction into one longer, more fluent sentence. Get pupils to find and fix a tense-switching error in their own draft as practice.",
        conceptExplanation:
          "Tense tells the reader WHEN an action happens (past, present, future), and within one piece of writing the tense should generally stay consistent — a story told in the past tense shouldn't randomly switch to present tense mid-sentence, since this confuses the reader about the story's timeline. Sentence combining takes two short, choppy sentences that share a connection and joins them with a conjunction (and, but, so, because) into one sentence that reads more fluently — the choice of conjunction must match the logical relationship between the two ideas (addition, contrast, result, or reason), not be chosen at random.",
        workedExamples: [
          {
            problem: "Find and fix the tense error: 'Yesterday, I walked to the park. I see my friend there.'",
            solution: [
              "Identify the established tense from the first sentence — 'walked' is past tense, signalled also by 'Yesterday'.",
              "Find the sentence that breaks this pattern — 'I see' is present tense, which doesn't match.",
              "Correct it to match the established past tense: 'I saw my friend there.'",
              "Corrected: 'Yesterday, I walked to the park. I saw my friend there.' — both sentences now agree on when the story is happening.",
            ],
          },
          {
            problem: "Combine into one sentence using the best conjunction: 'The sky grew dark.' + 'We hurried home.'",
            solution: [
              "Identify the relationship between the two ideas — the darkening sky is the REASON they hurried home, not just an added detail.",
              "Reject 'and' (which would just add the ideas without showing the cause-effect link) in favour of 'so,' which signals a result.",
              "Combined: 'The sky grew dark, so we hurried home.' — the single conjunction 'so' now carries the meaning that was previously implied but unstated between two separate sentences.",
            ],
          },
        ],
        teachingSteps: [
          "Show a short paragraph with a deliberate tense-switching error and ask pupils to spot what sounds wrong.",
          "Discuss why consistent tense matters, then have pupils fix the error together as a class.",
          "Model combining two short, choppy sentences into one longer sentence using and, but, so or because.",
          "Give pupils 3-4 pairs of short sentences to combine themselves, checking their choice of conjunction makes sense.",
          "Have pupils reread a piece of their own recent writing and circle any tense that doesn't match the rest.",
          "Guide each pupil to fix their own circled error, explaining out loud why the correction is right.",
        ],
      },
      {
        title: "Expanding Vocabulary and Word Study",
        strand: "Reading and Viewing",
        description:
          "Introduces basic word-building — prefixes, suffixes and simple synonyms/antonyms — so pupils can work out unfamiliar words instead of always asking. Tie every new word back to a sentence from the current reading text rather than teaching it in isolation.",
        conceptExplanation:
          "A prefix is added to the front of a root word and changes its meaning (un- + happy = unhappy, meaning 'not happy'); a suffix is added to the end and often changes the word's grammatical form or meaning (help + -ful = helpful, meaning 'full of help'). Once a pupil knows a prefix or suffix's meaning, they can work out unfamiliar words built from a root they already know, which is a far more scalable skill than memorising every word individually. A synonym is a word with a similar meaning (happy/glad) and an antonym is a word with an opposite meaning (happy/sad) — recognising both helps pupils build richer, more varied vocabulary rather than reusing the same handful of words.",
        workedExamples: [
          {
            problem: "The pupil knows 'happy' and 'kind.' Work out the meaning of 'unhappy' and 'unkind.'",
            solution: [
              "Identify the shared prefix in both new words: 'un-'.",
              "Recall or establish 'un-' means 'not' when added to the front of a describing word.",
              "Apply the rule: 'unhappy' = 'not happy'; 'unkind' = 'not kind'.",
              "Confirm both make sense in a sample sentence: 'The unhappy boy did not smile' — the meaning fits.",
            ],
          },
          {
            problem: "In the sentence 'The tired dog walked slowly,' find a synonym and an antonym for 'tired.'",
            solution: [
              "Recall that a synonym has a similar meaning — 'sleepy' or 'exhausted' both mean roughly the same as 'tired'.",
              "Recall that an antonym has the opposite meaning — 'energetic' or 'lively' mean the opposite of 'tired'.",
              "Test both by substitution: 'The exhausted dog walked slowly' still makes sense (synonym); 'The energetic dog walked slowly' sounds contradictory, which confirms it's a true opposite (antonym).",
            ],
          },
        ],
        teachingSteps: [
          "Find an unfamiliar word in the current reading text and ask pupils to guess its meaning from the surrounding sentence first.",
          "Introduce a common prefix or suffix (e.g. un-, -ful) and show 2-3 known words that use it.",
          "Have pupils build 2-3 new words themselves by adding the prefix/suffix to a root word, checking the meaning makes sense.",
          "Introduce one synonym and one antonym for a word from the text, discussing how each changes the sentence's meaning.",
          "Have pupils find their own synonym or antonym for a different word in the same text, using a simple thesaurus if available.",
        ],
      },
      {
        title: "Introducing Note-Taking and Summarising Basics",
        strand: "Reading and Viewing",
        description:
          "Pupils practise jotting down 3–4 key words or short phrases from a short passage, then use those notes to say what the passage was mainly about in one sentence. This lays the groundwork for the summary skills tested from P5 onward.",
        conceptExplanation:
          "Note-taking means capturing the essential ideas of a passage in a few words rather than copying full sentences — the skill being built is IDENTIFYING what's essential versus what's minor detail, which is harder than it sounds for young readers who often want to write down everything. Summarising then uses those notes (not the original text) to state the passage's main idea in one sentence — this two-step process (extract key words, then rebuild them into a sentence) is deliberately different from copying a sentence straight from the text, because it forces genuine understanding rather than simple retrieval.",
        workedExamples: [
          {
            problem:
              "Passage: 'Bees fly from flower to flower collecting nectar. As they move, pollen sticks to their bodies and spreads to other flowers, helping plants grow.' Jot 3-4 key words, then summarise in one sentence.",
            solution: [
              "Read the passage once just to understand it, without writing anything yet.",
              "Read again and jot only the essential words: 'bees, nectar, pollen, plants grow' — skipping connecting words like 'from flower to flower' or 'as they move'.",
              "Using only these jotted words (not looking back at the original text), build one sentence: 'Bees collect nectar and spread pollen, which helps plants grow.'",
              "Check the summary captures the passage's main idea without copying its exact wording.",
            ],
          },
          {
            problem: "A pupil's notes for a passage about volcanoes read: 'volcano, hot, lava, mountain, red, exciting, big explosion, scientists study them.' Which notes are NOT essential?",
            solution: [
              "Check each note against the passage's likely main idea (what a volcano is and does).",
              "'red' and 'exciting' are minor or subjective descriptive details, not core facts about what a volcano is.",
              "'volcano, hot, lava, mountain, big explosion' are the essential facts that would appear in a one-sentence summary.",
              "'scientists study them' might be essential or might be a minor add-on depending on how much of the passage it covered — this judgement call is exactly the skill being practised.",
            ],
          },
        ],
        teachingSteps: [
          "Read a short passage aloud once, telling pupils to just listen, not write anything yet.",
          "Read it again, this time modelling how you jot down 3-4 key words rather than full sentences.",
          "Have pupils read a second short passage themselves and jot their own 3-4 key words or short phrases.",
          "Ask pupils to use only their jotted notes (not the original text) to say what the passage was mainly about in one sentence.",
          "Compare a few pupils' one-sentence summaries, discussing which notes were most useful for getting there.",
        ],
      },
    ],
  },
  {
    level: "P4",
    topics: [
      {
        title: "Oracy: Structured Discussion and Presenting Ideas",
        strand: "Oracy",
        description:
          "Pupils take part in short group discussions with an assigned role (starting, agreeing/disagreeing, summing up) and give a 1–2 minute prepared talk on a familiar topic. Give a simple discussion frame ('I think... because... What do you think?') to pupils who go quiet in groups.",
        conceptExplanation:
          "Assigning explicit roles in a group discussion (starter, agree/disagree, summariser) exists because free-form group talk tends to be dominated by confident speakers while quieter pupils disengage — a role gives every pupil a specific, achievable job and a moment where speaking is expected of them. A discussion frame ('I think... because... What do you think?') provides the sentence structure for contributing without needing to invent one from scratch under social pressure, freeing mental effort for the actual content of the opinion. A prepared talk differs from spontaneous speech in that it's planned in advance around a small number of key points (not scripted word-for-word), which builds the organisational skill needed for longer oral tasks later.",
        workedExamples: [
          {
            problem: "Model using the discussion frame to respond to: 'Should school days be longer?'",
            solution: [
              "State a clear position first: 'I think school days should not be longer'.",
              "Add the reason using 'because': 'because students already have a lot of homework and need rest time'.",
              "Hand the conversation to the next speaker using the frame's final part: 'What do you think?' — this is the step that turns a statement into genuine discussion.",
            ],
          },
          {
            problem: "Plan a 1-2 minute talk on the familiar topic 'My Favourite Hobby' using only 3 key points.",
            solution: [
              "Choose the hobby and jot exactly 3 points, not a full script — e.g. 'what it is, why I enjoy it, one memorable moment'.",
              "Order the points logically: introduce the hobby first, then the reason for enjoying it, then the specific memory, which builds naturally from general to specific.",
              "Practise speaking from the 3 jotted points aloud, checking the talk naturally reaches 1-2 minutes without needing a memorised script — if it's too short, the memorable-moment point usually needs more detail.",
            ],
          },
        ],
        teachingSteps: [
          "Assign each pupil in a small group a discussion role (starter, agree/disagree, summariser) and explain what each role says.",
          "Model the discussion frame yourself ('I think... because... What do you think?') on a simple, familiar topic.",
          "Run one practice discussion round with roles, coaching quieter pupils to use the frame when they freeze.",
          "Have pupils prepare a short 1-2 minute talk on a familiar topic, jotting 3 key points only, not a full script.",
          "Let each pupil deliver their talk to a partner or small group, then rotate roles so everyone experiences each one.",
        ],
      },
      {
        title: "Reading and Viewing: Comparing Narrative and Non-Narrative Texts",
        strand: "Reading and Viewing",
        description:
          "Pupils read a narrative and a non-narrative text on a related theme side by side and compare purpose, structure and language choices. This comparative habit is exactly what PSLE comprehension later expects, so it's worth building explicitly from here.",
        conceptExplanation:
          "Narrative and non-narrative texts differ in three linked ways that pupils should learn to check systematically: purpose (to tell a story and entertain, versus to inform or explain), structure (chronological beginning-middle-end, versus organised by topic/headings), and language (often includes dialogue and descriptive/emotional language, versus more factual, precise language). Comparing two texts on the SAME theme isolates these differences cleanly, since the topic is held constant while the text type changes — this is exactly the skill PSLE comprehension papers test when they ask pupils to identify a text's purpose or compare information across sources.",
        workedExamples: [
          {
            problem: "Compare the purpose of these two texts on the same theme (the rainforest): a story about a boy lost in the rainforest, versus a report titled 'Facts About the Rainforest.'",
            solution: [
              "Check the story's purpose — it follows one character's experience over time and likely builds tension or emotion, so its purpose is to entertain through narrative.",
              "Check the report's purpose — it's organised as facts under a title, with no character or plot, so its purpose is to inform.",
              "State the comparison directly: the story entertains through one character's journey; the report informs through organised facts, even though both are 'about' the same rainforest theme.",
            ],
          },
          {
            problem: "Which text would you use to answer 'What animals live in the rainforest?' — the story or the report — and why?",
            solution: [
              "Consider the story's structure — facts about animals would only appear incidentally if the plot happened to mention them, not organised for easy lookup.",
              "Consider the report's structure — informational texts are typically organised under topic headings, making specific facts easy to locate directly.",
              "Conclusion: the report is the better choice for a factual lookup question, since its structure is built for exactly that purpose.",
            ],
          },
        ],
        teachingSteps: [
          "Read the narrative text first and identify its purpose (to tell a story) and structure (beginning-middle-end).",
          "Read the non-narrative text on the same theme and identify its purpose (to inform/explain) and structure (headings or facts).",
          "Build a two-column comparison chart together covering purpose, structure and one language difference (e.g. dialogue vs. facts).",
          "Have pupils find one sentence from each text that best shows its purpose, explaining their choice.",
          "Ask pupils which text they'd use to answer a factual question and which to enjoy a story, to cement the purpose distinction.",
        ],
      },
      {
        title: "Writing and Representing: Descriptive and Recount Writing",
        strand: "Writing and Representing",
        description:
          "Raises the bar on descriptive writing — using the five senses and specific detail instead of generic adjectives ('happy' becomes 'grinning from ear to ear') — alongside more structured personal recounts. Model one strong example sentence, then have pupils rewrite a weak one themselves.",
        conceptExplanation:
          "Generic adjectives (nice, good, happy, big) tell a reader almost nothing specific because they could describe almost anything — strong descriptive writing instead shows a feeling or quality through a specific, sensory detail that lets the reader infer the same thing for themselves ('grinning from ear to ear' lets the reader infer happiness without the word ever being used). The five senses (sight, sound, smell, touch, taste) are a practical checklist for generating this kind of detail, since asking 'what did it look/sound/smell like?' produces far more specific material than asking 'how did you feel?' A structured recount at this level goes beyond a simple event list to include this same sensory specificity woven into the retelling.",
        workedExamples: [
          {
            problem: "Upgrade this generic sentence using a sensory detail: 'The food was delicious.'",
            solution: [
              "Identify 'delicious' as a generic word — it states a judgement without any specific, picturable detail.",
              "Choose a sense to draw detail from — taste and smell both fit food naturally.",
              "Rewrite with specific sensory detail: 'The spicy aroma of the curry filled the room, and the first bite made my mouth tingle.'",
              "Check the new version lets the reader infer 'delicious' without the word ever appearing — that's the mark of successful showing rather than telling.",
            ],
          },
          {
            problem: "Upgrade this generic sentence: 'He was scared.'",
            solution: [
              "Identify 'scared' as a generic feeling-word with no specific physical or sensory detail.",
              "Think about what fear actually looks or feels like physically — racing heart, sweaty palms, held breath.",
              "Rewrite: 'His heart pounded and his palms grew sweaty as he crept down the dark corridor.'",
              "Confirm the reader can infer fear from the physical details alone, without the word 'scared' being stated directly.",
            ],
          },
        ],
        teachingSteps: [
          "Show a weak, generic sentence ('The park was nice') and ask pupils what's missing.",
          "Model upgrading it using one of the five senses ('The park smelled of freshly cut grass, and children's laughter echoed from the playground').",
          "Brainstorm sensory details for a topic pupils will write about, sorting ideas by sense (sight, sound, smell, touch, taste).",
          "Give pupils 2-3 more weak sentences and have them rewrite each using a specific sensory detail.",
          "Have pupils write a short recount incorporating at least two of their upgraded sensory sentences.",
          "Read one strong rewritten sentence aloud per pupil to the class as positive reinforcement.",
        ],
      },
      {
        title: "Grammar in Context: Complex Sentences and Cohesion",
        strand: "Grammar in Context",
        description:
          "Introduces subordinate clauses (although, since, while) and cohesive devices that link ideas across sentences and paragraphs, not just within one sentence. Have pupils circle the linking words in a model paragraph before trying to use them in their own writing.",
        conceptExplanation:
          "A subordinate clause is a part of a sentence that can't stand alone as a complete sentence (e.g. 'although it was raining') and is attached to a main clause to add a relationship like contrast, reason or time ('Although it was raining, we still went outside'). This is a step up from the simple conjunctions taught earlier because subordinate clauses can move to different positions in the sentence and add more precise shades of meaning. Cohesive devices (however, then, as a result) do a similar linking job but ACROSS sentences and paragraphs rather than within one sentence — they're what makes a piece of writing feel connected as a whole, rather than a list of disconnected sentences.",
        workedExamples: [
          {
            problem: "Combine using 'although': 'It was raining.' + 'We went outside to play.'",
            solution: [
              "Identify the relationship — the rain would normally stop outdoor play, so this is a contrast/concession relationship.",
              "'although' is the correct subordinating word for contrast, placed before the less-expected outcome's cause.",
              "Combined: 'Although it was raining, we went outside to play.' — note the subordinate clause can also move: 'We went outside to play, although it was raining' works too.",
            ],
          },
          {
            problem: "Add a cohesive device to link these two sentences across a paragraph break: 'The team trained hard all season.' [new paragraph] 'They won the championship.'",
            solution: [
              "Identify the relationship between the two ideas — the hard training led to the outcome of winning, a cause-and-result relationship across the paragraph break.",
              "Choose a cohesive device signalling result: 'As a result,' fits better than a simple time word like 'then,' since it makes the cause-effect link explicit.",
              "Linked: 'The team trained hard all season. As a result, they won the championship.' — the reader now understands the connection between the two paragraphs, not just their sequence.",
            ],
          },
        ],
        teachingSteps: [
          "Show a model paragraph and have pupils circle every linking word (although, since, while, however, then) they can find.",
          "Discuss what job each circled word does — does it show a reason, a contrast, or a time sequence?",
          "Model building one complex sentence live, starting with a simple sentence and adding a subordinate clause with although or since.",
          "Have pupils combine 2-3 pairs of simple sentences themselves using a subordinate clause of their choice.",
          "Guide pupils to add at least one cohesive linking word into a paragraph of their own writing, checking it connects the right ideas.",
        ],
      },
      {
        title: "Introduction to Situational Writing Formats",
        strand: "Writing and Representing",
        description:
          "A first look at the practical writing formats tested from P5 onward — a simple note or informal email — focusing on including all the key information a reader would need. Use a real-looking scenario (a picture and a short brief) rather than an abstract prompt.",
        conceptExplanation:
          "Situational writing responds to a specific real-world scenario (leaving a note, writing an email) rather than expressing free creative ideas — success is judged mainly on whether the reader receives everything they'd actually need to know from that scenario (task fulfilment), not primarily on beautiful language. Every situational writing brief contains a set of required content points, usually answerable as who, what, when, where and sometimes why — treating the brief like a checklist to work through, rather than writing freely and hoping the right details appear, is the core skill being introduced here and will matter increasingly through P5, P6 and O-Level.",
        workedExamples: [
          {
            problem: "Brief: 'Leave a note for your mother saying you have gone to your friend Ali's house to study, and will be back by 6pm.' List the required content points.",
            solution: [
              "Extract WHO: going to Ali's house (a specific detail the reader needs, not just 'a friend's house').",
              "Extract WHAT: going to study (the reason/purpose).",
              "Extract WHEN: back by 6pm (a specific time).",
              "Confirm all three points must appear in the note — a note missing any one of these hasn't fully answered the brief, regardless of how well-written the sentences are.",
            ],
          },
          {
            problem: "Check this draft note against the brief above: 'Mum, gone out with Ali. Back soon.'",
            solution: [
              "Check WHO — 'Ali' is mentioned, but WHERE (Ali's house) is missing.",
              "Check WHAT — the purpose 'to study' is missing entirely.",
              "Check WHEN — 'back soon' is vague and doesn't state the required '6pm'.",
              "Conclusion: this draft is missing 2 of 3 required content points and has a vague version of the third — it would lose marks for task fulfilment even though the sentences themselves are grammatically fine.",
            ],
          },
        ],
        teachingSteps: [
          "Present a realistic scenario with a picture and a short written brief (e.g. leaving a note for a family member).",
          "Identify together what information the reader absolutely needs to know from the brief (who, what, when, where).",
          "Model writing a short note that covers every required point, checking each one off the brief as you write it.",
          "Have pupils plan their own response by listing the required points before drafting a single sentence.",
          "Check each pupil's draft against the brief's checklist, flagging any missing point before they finalise it.",
        ],
      },
      {
        title: "Comprehension Strategies: Literal and Inferential Questions",
        strand: "Reading and Viewing",
        description:
          "Explicitly teaches the difference between literal questions (answer is stated in the text) and inferential questions (answer must be worked out from clues), a distinction many pupils never have named for them. Practise sorting a set of questions into the two types before answering.",
        conceptExplanation:
          "A literal question's answer is directly stated in the text — the reader's job is to locate and often quote it, requiring careful searching but not reasoning beyond the text. An inferential question's answer is NOT directly stated — the reader must combine a clue from the text with their own background knowledge or reasoning to work it out (e.g. a character 'slammed the door and stormed off' implies anger, even though the word 'angry' never appears). Naming this distinction explicitly matters because pupils who don't recognise a question as inferential often search fruitlessly for a directly-stated answer that doesn't exist, then guess randomly instead of reasoning from the available clues.",
        workedExamples: [
          {
            problem:
              "Text: 'Mei slammed the door and threw her bag on the floor.' Question: 'How did Mei feel?' — is this literal or inferential, and what's the answer?",
            solution: [
              "Search the text for the word describing Mei's feeling directly — there isn't one; only actions are described.",
              "Recognise this as inferential, since the answer must be worked out from clues (slamming, throwing) rather than read directly.",
              "Reason from the clues: slamming a door and throwing a bag are actions typically associated with anger or frustration.",
              "Answer: Mei felt angry or frustrated — justified by the specific actions described, not just guessed.",
            ],
          },
          {
            problem: "Same text. Question: 'What did Mei throw on the floor?' — is this literal or inferential, and what's the answer?",
            solution: [
              "Search the text directly — 'threw her bag on the floor' contains the answer word-for-word.",
              "Recognise this as literal, since the answer is stated exactly in the text.",
              "Answer: her bag — quoted or closely paraphrased directly from the sentence.",
            ],
          },
        ],
        teachingSteps: [
          "Give pupils two questions about the same passage — one literal, one inferential — and ask which was easier to answer directly from the text.",
          "Explain the difference explicitly: literal answers are stated; inferential answers must be worked out from clues plus what pupils already know.",
          "Have pupils sort a mixed list of 6-8 questions into 'literal' and 'inferential' piles before answering any of them.",
          "Model answering one inferential question, explicitly naming the text clue used and the reasoning applied.",
          "Have pupils answer 2-3 inferential questions themselves, requiring them to state which clue in the text they used.",
        ],
      },
    ],
  },
  {
    level: "P5",
    topics: [
      {
        title: "Situational Writing: Emails, Notes and Informal Letters",
        strand: "Writing and Representing",
        description:
          "Pupils write to a given scenario using visual and written stimulus material, choosing the right format (email, note, informal letter) and making sure every required piece of information from the brief is included. Task fulfilment — covering all the content points — matters as much as language accuracy here.",
        conceptExplanation:
          "PSLE situational writing is scored on two roughly equal dimensions: task fulfilment (did the response include every required content point from the brief, in an appropriate format) and language (grammar, vocabulary, tone). A response can be grammatically flawless but score poorly if it misses a required content point, and conversely a response with minor language slips can still score well if every point is covered accurately — this is why underlining the brief's content points BEFORE drafting is a non-negotiable first step, not an optional extra. Format choice (email vs. note vs. informal letter) is usually signalled by the scenario itself (e.g. 'your friend is overseas' implies email, not a note left on a table), and each format has its own opening/closing convention that must match.",
        workedExamples: [
          {
            problem:
              "Brief: 'Write an email to your cousin who lives overseas, inviting her to your birthday party next month, telling her the date, time and venue.' Underline the required content points.",
            solution: [
              "Identify the format signal — 'cousin who lives overseas' means a letter/note can't be physically handed over, so email is the correct format.",
              "Extract the content points required: the invitation itself, the date, the time, and the venue — four distinct pieces of information.",
              "Confirm the appropriate tone — writing to a cousin is informal/friendly, not formal, which affects word choice and greeting style (e.g. 'Hi' rather than 'Dear Sir/Madam').",
            ],
          },
          {
            problem: "Check this draft against the brief above: 'Hi Sarah, I'm having a birthday party next month at my house. Hope you can come! Love, Mei'",
            solution: [
              "Check content point 1 (invitation) — present, via 'having a birthday party... hope you can come'.",
              "Check content point 2 (date) — missing; 'next month' is too vague to count as a specific date.",
              "Check content point 3 (time) — missing entirely.",
              "Check content point 4 (venue) — partially present ('at my house') but could be more specific.",
              "Conclusion: this draft would lose task fulfilment marks for the missing date and time, even though its tone and format are correct.",
            ],
          },
        ],
        teachingSteps: [
          "Read the scenario and stimulus material together, underlining every content point the brief requires.",
          "Discuss which format (email, note, informal letter) fits the scenario and why, checking the correct greeting/closing convention for it.",
          "Model turning the underlined content points into a plan, one point per planned sentence or paragraph.",
          "Have pupils draft their response, checking off each content point from the brief as they include it.",
          "Peer-check in pairs: swap drafts and verify every brief point is present before a final read-through for tone and accuracy.",
        ],
      },
      {
        title: "Continuous Writing: Plot and Character Development",
        strand: "Writing and Representing",
        description:
          "Moves composition writing toward PSLE demands: a clear plot arc, believable character motivation, and showing rather than telling emotion. Have pupils outline their plot in 3–4 bullet points before writing — this alone fixes most of the 'ran out of time/ideas' problem.",
        conceptExplanation:
          "A plot arc has a recognisable shape: a normal situation, a problem that raises stakes, a climax where the problem is most intense, and a resolution — PSLE markers reward stories that follow this shape over ones that meander without rising tension. Character motivation means the character's actions make sense given who they are and what they want — a character who suddenly acts differently with no explanation feels unbelievable, so strong writing plants a reason for key actions. 'Showing not telling' means conveying emotion or character through actions, dialogue and physical detail rather than simply naming the feeling ('She was sad' tells; 'She stared at the floor, blinking back tears' shows) — showing is more engaging because it lets the reader do some of the inferring themselves.",
        workedExamples: [
          {
            problem: "Outline a 3-4 point plot arc for the story-starter: 'I had never been so nervous in my life.'",
            solution: [
              "Point 1 (situation): establish what's about to happen that causes nervousness — e.g. about to perform a piano solo at a concert.",
              "Point 2 (problem/rising stakes): something goes wrong or raises the tension — e.g. forgetting the first few notes on stage.",
              "Point 3 (climax): the most intense moment — e.g. deciding whether to stop or keep going, choosing to improvise.",
              "Point 4 (resolution): the outcome and how it resolves the nervousness — e.g. finishing the piece to applause despite the mistake, learning something about resilience.",
            ],
          },
          {
            problem: "Rewrite this 'telling' sentence as 'showing': 'He was very angry when his brother broke his toy.'",
            solution: [
              "Identify the stated emotion word to remove: 'angry'.",
              "Think of physical actions or dialogue that would accompany real anger — clenched fists, a raised voice, an accusing tone.",
              "Rewrite showing instead of telling: 'His fists clenched and his voice rose to a shout the moment he saw the broken toy in his brother's hands.'",
              "Confirm a reader can infer anger from the physical description alone, without the word 'angry' appearing.",
            ],
          },
        ],
        teachingSteps: [
          "Read a strong model composition and identify its plot arc (situation, problem, climax, resolution) as a class.",
          "Discuss a moment where the writer 'showed' emotion through action instead of stating it, contrasting it with a flat 'telling' version.",
          "Have pupils outline their own story in 3-4 bullet points covering situation, problem, climax and resolution before writing anything else.",
          "Model rewriting one 'telling' sentence ('She was sad') into a 'showing' one ('She stared at the floor, blinking back tears').",
          "Guide pupils to write their story from the outline, pausing after the problem section to check the plot is still on track.",
          "Have pupils find and upgrade one telling sentence in their own draft into a showing one.",
        ],
      },
      {
        title: "Comprehension: Literal, Inferential and Vocabulary-in-Context Questions",
        strand: "Reading and Viewing",
        description:
          "Practises the full PSLE comprehension question range on a single passage, including vocabulary-in-context items where pupils must work out a word's meaning from surrounding clues rather than a dictionary definition. Teach pupils to always quote or point to their textual evidence.",
        conceptExplanation:
          "Vocabulary-in-context questions test whether a pupil can determine a word's meaning AS USED IN THIS SPECIFIC PASSAGE, using surrounding sentence clues — this differs from a dictionary definition because many words have multiple meanings, and the passage's context narrows down which one applies. Every PSLE comprehension answer, regardless of question type, should be traceable back to specific textual evidence — for literal questions this means quoting directly, for inferential questions it means citing the clue(s) used to reach the inference — because answers with no textual grounding are marked as unsupported guesses even if they happen to be correct.",
        workedExamples: [
          {
            problem:
              "'The exhausted hikers trudged wearily up the final slope, their legs aching with every step.' What does 'trudged' mean as used here?",
            solution: [
              "Look for surrounding clues rather than relying on a prior memorised definition — 'exhausted,' 'wearily,' and 'legs aching' all describe tiredness and difficulty.",
              "Infer that 'trudged' must mean walking in a slow, heavy, effortful way, consistent with all the surrounding tiredness clues.",
              "Confirm by substitution: 'walked slowly and heavily' fits the sentence's meaning and tone.",
              "Answer: 'trudged' means walked slowly and with effort, especially due to tiredness — supported by the surrounding words 'exhausted,' 'wearily' and 'aching'.",
            ],
          },
          {
            problem: "Same passage. Question: 'How did the hikers feel? Support your answer with evidence from the text.'",
            solution: [
              "Identify this as an inferential question, since 'how they felt' isn't stated as a single feeling-word.",
              "Locate supporting evidence: 'exhausted,' 'trudged wearily,' 'legs aching'.",
              "Combine evidence into a supported answer: 'The hikers felt very tired, as shown by the words \"exhausted\", \"trudged wearily\" and \"their legs aching with every step\".'",
              "Confirm the answer explicitly quotes evidence rather than just stating a feeling with no textual support.",
            ],
          },
        ],
        teachingSteps: [
          "Read the passage together, pausing to model underlining potential evidence sentences as you go.",
          "Answer one literal question together, showing pupils how to quote directly from the text as their evidence.",
          "Answer one inferential question together, showing how the evidence plus reasoning combine into the answer.",
          "Model a vocabulary-in-context question: cover the unfamiliar word and use only the surrounding sentence to guess its meaning, then check the guess makes sense in context.",
          "Have pupils attempt the remaining questions independently, requiring every answer to reference a specific line or evidence from the text.",
          "Review answers together, checking pupils actually quoted evidence rather than just writing what they think they remember.",
        ],
      },
      {
        title: "Grammar in Context: Editing for Common Errors",
        strand: "Grammar in Context",
        description:
          "Targets the error types that show up repeatedly in PSLE editing passages — subject-verb agreement, tense consistency, prepositions — using short error-spotting passages rather than isolated fill-in-the-blank drills. Build a personal 'error log' per pupil of their own recurring mistakes.",
        conceptExplanation:
          "Subject-verb agreement means the verb form must match whether the subject is singular or plural ('The dog runs' vs. 'The dogs run') — errors often creep in when a phrase sits between subject and verb and pupils agree the verb with the wrong nearby noun. Tense consistency means keeping the same time-frame throughout a passage unless there's a genuine reason to shift. Preposition errors (in/on/at, for/since) are common because prepositions in English often don't follow a single clean rule and must be learned partly through exposure. A personal error log works because pupils repeat their OWN specific mistakes far more than random ones — tracking and targeting those specific patterns is more efficient than generic grammar revision.",
        workedExamples: [
          {
            problem: "Find and fix the subject-verb agreement error: 'The list of items on the table were very long.'",
            solution: [
              "Identify the true subject of the verb — it's 'list' (singular), not 'items' (plural), even though 'items' sits closer to the verb.",
              "Check the verb 'were' — it agrees with the plural 'items', which is the trap, not the actual grammatical subject.",
              "Correct: 'The list of items on the table was very long.' — the verb must agree with 'list', the true subject.",
            ],
          },
          {
            problem: "Choose the correct preposition: 'The meeting is scheduled ___ 3pm ___ Friday.'",
            solution: [
              "For a specific clock time, the correct preposition is 'at' → 'at 3pm'.",
              "For a specific day, the correct preposition is 'on' → 'on Friday'.",
              "Complete sentence: 'The meeting is scheduled at 3pm on Friday.' — note 'in' would be used instead for a longer period like a month ('in June'), which is why these three prepositions are often confused.",
            ],
          },
        ],
        teachingSteps: [
          "Give pupils a short passage with 4-5 planted errors and have them try to spot as many as possible individually first.",
          "Go through the passage together, naming the error type for each one found (subject-verb agreement, tense, preposition).",
          "Model a systematic check method: read once for meaning, then read again checking only tense, then again checking only agreement.",
          "Have pupils apply the same systematic method to a second short passage on their own.",
          "Review each pupil's own recent writing briefly, noting one recurring error type into their personal error log.",
          "Have pupils correct one example of their own logged error type as focused practice.",
        ],
      },
      {
        title: "Oracy: Stimulus-Based Conversation",
        strand: "Oracy",
        description:
          "Introduces the PSLE oral format directly: pupils respond to a picture stimulus with their own view, then take part in a short conversation about it with the tutor. Push past a one-line answer — ask 'why do you think that?' every time to build the habit of elaborating.",
        conceptExplanation:
          "The PSLE oral's stimulus-based conversation assesses whether a pupil can sustain a genuine, elaborated exchange, not just answer one question correctly — markers are specifically listening for pupils who develop their ideas with reasons and examples rather than replying in short, closed statements. A strong opening response to a picture typically has two parts: a description of what's happening, and a personal view or connection to it. From there, the conversation is meant to go deeper into that view, which is why relentlessly asking 'why do you think that?' is the single most effective coaching habit — it trains the pupil to expect and prepare for elaboration rather than treating one sentence as a complete answer.",
        workedExamples: [
          {
            problem: "A picture shows children helping clean up a park. Model a full opening response.",
            solution: [
              "Describe what's happening first: 'In this picture, I can see a group of children picking up litter in a park.'",
              "Add a personal view or connection, not just description: 'I think this is a good thing to do because it keeps the environment clean for everyone.'",
              "Confirm the response has both parts (description + view) rather than stopping after description alone, which is the most common way pupils under-deliver at this stage.",
            ],
          },
          {
            problem: "A pupil answers 'Yes' when asked 'Do you think it's important to keep parks clean?' — how does the tutor build a fuller exchange?",
            solution: [
              "Do not accept the one-word answer as complete — immediately ask 'Why do you think that?'",
              "If the pupil gives a short reason (e.g. 'because it looks nicer'), push once more: 'Can you give me an example of why that matters to people?'",
              "Model, if needed, what a fuller answer sounds like: 'Yes, because a clean park is safer and more pleasant for families to spend time in, and it shows respect for a shared public space' — demonstrating the elaboration expected.",
            ],
          },
        ],
        teachingSteps: [
          "Show a picture stimulus and model giving a full opening response (description plus a personal view) yourself.",
          "Have a pupil describe the picture, then push with 'why do you think that?' every time they give a short answer.",
          "Practise a short back-and-forth conversation with one pupil, modelling how to build on their answer with a follow-up.",
          "Pair pupils up to practise the same picture stimulus, coaching them to ask each other 'why' rather than moving on.",
          "Rotate to a new picture stimulus and have each pupil complete a full response-plus-conversation exchange independently.",
        ],
      },
      {
        title: "Synthesis and Transformation of Sentences",
        strand: "Grammar in Context",
        description:
          "Pupils practise rewriting two given sentences into one, using a specified connector or structure, without changing the original meaning — a distinct PSLE component that needs its own dedicated practice. Start with the easier connector-given format before removing the scaffold.",
        conceptExplanation:
          "Synthesis and transformation tests whether a pupil deeply understands sentence structure and meaning, not just grammar rules in isolation — the core constraint is that the ORIGINAL MEANING must be fully preserved in the new sentence, even though its grammatical form changes completely. In the connector-given format, a specific joining word is provided and the pupil must restructure both sentences around it; in the structure-given format, only a sentence opener or pattern is given, requiring the pupil to work out which connector or structure achieves the same meaning independently. The most common error is producing a grammatically correct sentence that has subtly shifted the original meaning.",
        workedExamples: [
          {
            problem: "Combine using 'unless': 'You will fail the test.' + 'You study hard.'",
            solution: [
              "Understand 'unless' means 'if not' — it sets up a condition where the first idea happens only in the absence of the second.",
              "Structure: [result] unless [condition that prevents it] → 'You will fail the test unless you study hard.'",
              "Check meaning is preserved: this correctly conveys that studying hard is what prevents failing, matching the original two separate sentences.",
            ],
          },
          {
            problem: "Rewrite beginning with 'No sooner...': 'The bell rang. The students rushed out.'",
            solution: [
              "Recognise 'No sooner... than...' is an inverted structure signalling one event happening immediately after another.",
              "Apply the required inversion (subject and helping verb swap order after 'No sooner'): 'No sooner had the bell rung than the students rushed out.'",
              "Check meaning is preserved: the sequence and immediacy (bell rings, then instantly students rush out) matches the original two sentences exactly, just in a more sophisticated structure.",
            ],
          },
        ],
        teachingSteps: [
          "Show two simple sentences and a given connector, modelling how to combine them into one without changing the meaning.",
          "Have pupils try 2-3 more connector-given combinations themselves, checking the meaning hasn't shifted.",
          "Introduce a structure-given item (e.g. 'begin your sentence with...') and model the transformation live.",
          "Have pupils attempt 2-3 structure-given transformations, checking against the original meaning each time.",
          "Remove the scaffold: give two sentences with no connector specified and have pupils choose and justify their own.",
        ],
      },
    ],
  },
  {
    level: "P6",
    topics: [
      {
        title: "Situational Writing: Formal Letters and Reports",
        diagram: { type: "flow", steps: ["Salutation", "Opening", "Body", "Closing", "Signature"] },
        strand: "Writing and Representing",
        description:
          "Extends situational writing to more formal formats — a letter of request/complaint or a short report — with attention to appropriate tone and register for the audience specified in the brief. Compare an informal and formal response to the same scenario side by side so the register shift is concrete.",
        conceptExplanation:
          "Register is the level of formality in language, and it must match the audience and purpose specified in the brief — writing to a school principal about a complaint demands a different register than writing to a friend, even if the underlying message is similar. Formal register in English typically avoids contractions (use 'do not' not 'don't'), uses polite/indirect requests ('I would be grateful if...' rather than 'Please give me...'), and includes proper formal greetings and closings. Recognising which format and register a brief calls for — before writing a single sentence — prevents the single most common P6 situational writing error: an otherwise well-written response that's disqualified or heavily penalised for the wrong tone.",
        workedExamples: [
          {
            problem: "Rewrite this informal complaint sentence in formal register: 'The canteen food is really bad and you guys need to fix it now.'",
            solution: [
              "Identify informal features: contraction-free but blunt phrasing, 'you guys,' and the demanding tone of 'need to fix it now'.",
              "Replace with polite, indirect phrasing appropriate for a formal complaint letter: 'I am writing to express my concern regarding the quality of food served in the canteen.'",
              "Add a polite, formal request rather than a demand: 'I would be grateful if this matter could be looked into.'",
              "Confirm the meaning (concern about food quality, request for action) is preserved while the tone has shifted entirely to formal register.",
            ],
          },
          {
            problem: "A brief asks for a formal letter to a school principal requesting permission for a school trip. Which greeting and closing are appropriate?",
            solution: [
              "Reject informal greetings like 'Hi' or 'Dear Mr [First name]' — these don't match a formal request to an authority figure.",
              "Choose the standard formal greeting: 'Dear Principal [Surname],' or 'Dear Sir/Madam,' if the name is unknown.",
              "Choose the standard formal closing matching the greeting convention: 'Yours faithfully,' (if the name was unknown) or 'Yours sincerely,' (if the name was used) followed by the writer's full name.",
            ],
          },
        ],
        teachingSteps: [
          "Show an informal and a formal response to the same scenario side by side and ask pupils to spot the tone differences.",
          "List the specific formal conventions used (greeting, no contractions, polite requests) as a reference checklist.",
          "Read the new scenario's brief together, identifying the required content points and the audience's expected tone.",
          "Model drafting the opening paragraph in formal register, explicitly narrating word choices as you make them.",
          "Have pupils draft the rest of the response, checking off content points and self-checking tone against the reference checklist.",
          "Peer-review in pairs specifically for register slips (informal words creeping into a formal letter).",
        ],
      },
      {
        title: "Continuous Writing: Language Craft and Figurative Devices",
        strand: "Writing and Representing",
        description:
          "Focuses on elevating language quality — precise vocabulary, varied sentence openers and lengths, and figurative devices (simile, personification) used purposefully rather than decoratively. One well-crafted paragraph rewritten from a flat draft teaches more than five generic 'use more adjectives' notes.",
        conceptExplanation:
          "A simile compares two unlike things using 'like' or 'as' ('brave as a lion') to make a description more vivid by borrowing associations from something familiar; personification gives human qualities to something non-human ('the wind howled in anger') to create mood or emphasis. These devices only strengthen writing when they're chosen PURPOSEFULLY to fit the specific moment's meaning — a simile added just to tick a checklist box, without it actually clarifying or intensifying the image, is decoration, not craft. Sentence variety (mixing short punchy sentences with longer flowing ones, and varying how sentences begin) prevents writing from feeling monotonous, since a paragraph of same-length, same-opener sentences reads flatly regardless of vocabulary quality.",
        workedExamples: [
          {
            problem: "Add a purposeful simile to strengthen this sentence: 'The old man walked slowly down the street.'",
            solution: [
              "Identify what quality of the walking could be made more vivid — the slowness and perhaps frailty.",
              "Choose a comparison that specifically evokes slow, careful movement, not a random unrelated image: 'like a tortoise carrying a heavy shell'.",
              "Combined: 'The old man walked down the street like a tortoise carrying a heavy shell, each step slow and deliberate.'",
              "Check the simile adds genuine meaning (evokes both slowness AND a sense of burden) rather than being decorative — a poor simile chosen just for effect (e.g. 'like a shooting star') wouldn't fit the intended slow, weary mood.",
            ],
          },
          {
            problem: "Vary the sentence openers in this flat paragraph: 'I woke up. I got dressed. I ate breakfast. I left for school.'",
            solution: [
              "Notice every sentence starts identically with 'I', creating a monotonous rhythm.",
              "Rewrite some openers using different structures — starting with a time phrase, a participle, or combining ideas: 'As soon as I woke up, I got dressed quickly. After a hurried breakfast, I left for school.'",
              "Check the paragraph now has varied sentence length and openers while keeping the same events and meaning as the original.",
            ],
          },
        ],
        teachingSteps: [
          "Read a flat, plain draft paragraph aloud and ask pupils what makes it feel dull.",
          "Model rewriting one sentence with a purposeful simile or personification, explaining why it was chosen (not just added for decoration).",
          "Show 2-3 sentence openers besides 'The/I/He' (e.g. starting with a verb, a description, a sound) and have pupils try rewriting an opener.",
          "Have pupils select one paragraph of their own recent writing and identify where a figurative device could genuinely add meaning.",
          "Guide each pupil to rewrite that one paragraph, varying at least one sentence length and adding one purposeful figurative device.",
          "Read a few rewritten paragraphs aloud, discussing whether the added device actually strengthened the meaning or just decorated it.",
        ],
      },
      {
        title: "Comprehension: Evaluative Questions and Cloze Passages",
        strand: "Reading and Viewing",
        description:
          "Adds evaluative comprehension questions (judging a character's action, evaluating an argument) and cloze passage practice, both of which demand a step beyond literal/inferential reading. Cloze in particular rewards a wide vocabulary built up over the years, not last-minute drilling.",
        conceptExplanation:
          "An evaluative question asks the reader to form and justify a JUDGEMENT (was a character's action right or wrong? was an argument convincing?), which is a step beyond inference because there's often no single 'correct' judgement — what matters is that the judgement is clearly stated and backed by specific reasoning from the text. A cloze passage removes words from a text and requires the reader to supply words that fit both grammatically (the right part of speech, tense, form) AND contextually (the right meaning for the surrounding sentence) — a word can sound grammatically fine but still be wrong if it doesn't fit the passage's actual meaning, which is why reading the whole sentence before guessing is essential.",
        workedExamples: [
          {
            problem: "'Ali found a wallet with money inside and kept it instead of returning it.' Evaluative question: 'Do you think Ali's action was right? Explain.'",
            solution: [
              "Form a clear judgement rather than a vague or hedging answer — e.g. 'No, Ali's action was not right.'",
              "Support the judgement with specific reasoning connected to the situation, not a generic moral statement: 'because the wallet and money belonged to someone else who was likely searching for it, and keeping it deprived them of their property.'",
              "Confirm the answer states a clear position AND justifies it with reasoning specific to the scenario, rather than only asserting an opinion.",
            ],
          },
          {
            problem: "Cloze: 'Despite the heavy rain, the marathon runners continued to ___ forward, determined to finish the race.'",
            solution: [
              "Read the whole sentence first, not just the gap, to establish the meaning needed — runners persisting despite difficult conditions.",
              "Consider grammatical fit — the gap needs a verb that pairs naturally with 'forward' and matches the surrounding tense.",
              "Consider contextual fit — the word must convey continued effort/determination, matching 'determined to finish'.",
              "Best answer: 'push' (or 'move', 'press') — 'push forward' fits both the grammar and the determined, effortful meaning; a word like 'walk' would be grammatically fine but weaker in matching the passage's emphasis on determination.",
            ],
          },
        ],
        teachingSteps: [
          "Read the passage and pose an evaluative question (was the character right to do that?), modelling a judgement backed by textual evidence.",
          "Have pupils form and justify their own judgement on a second evaluative question, requiring at least one piece of evidence.",
          "Introduce a cloze passage, modelling how to read the whole sentence (not just the gap) before choosing a word.",
          "Have pupils attempt 3-4 cloze gaps themselves, checking each choice fits both the grammar and the meaning of the sentence.",
          "Review answers together, discussing any gap where a plausible-sounding word was actually grammatically or contextually wrong.",
        ],
      },
      {
        title: "Oracy: PSLE Oral — Reading Aloud and Stimulus Conversation",
        strand: "Oracy",
        description:
          "Full PSLE oral exam practice: reading a passage aloud with correct pronunciation, stress and expression, then a stimulus-based conversation. Record and replay pupils reading aloud — hearing themselves back is one of the fastest ways to fix pacing and expression issues.",
        conceptExplanation:
          "PSLE oral reading aloud is marked on pronunciation (saying words correctly), fluency (smooth pacing without excessive hesitation), and expression (varying tone/stress to match meaning and punctuation, e.g. pausing at commas, rising intonation for questions) — these are distinct criteria, so a pupil can read accurately but still lose marks for flat, monotone delivery. Recording and replaying works because pupils' internal sense of how they sound is often inaccurate — a pupil who feels they read with expression may hear, on playback, that their voice actually stayed flat throughout, making the gap between self-perception and reality concrete and fixable.",
        workedExamples: [
          {
            problem: "Mark up this sentence for reading aloud: 'Could you believe it? The tiny kitten had climbed all the way to the top of the tall tree!'",
            solution: [
              "Identify the question mark — plan a rising intonation on 'Could you believe it?' to signal genuine surprise, not a flat statement tone.",
              "Identify the exclamation mark at the end — plan increased stress/energy on the final sentence to convey excitement.",
              "Identify key words worth stressing for meaning: 'tiny' (contrast with the big achievement) and 'all the way to the top' (emphasising the distance climbed).",
              "Practise reading with these planned pauses and stresses, rather than reading every word at the same flat pace and volume.",
            ],
          },
          {
            problem: "A recording reveals the pupil read the whole passage at one constant pace with no pauses at commas. What's the targeted fix?",
            solution: [
              "Identify the specific, single issue from the recording — lack of pausing at commas — rather than trying to fix everything at once.",
              "Have the pupil re-read just one sentence with commas, practising a brief, deliberate pause at each comma.",
              "Re-record the same passage and compare the two recordings side by side, confirming the comma-pausing issue specifically has improved before moving to a different focus area.",
            ],
          },
        ],
        teachingSteps: [
          "Give the pupil a passage to prepare silently first, marking punctuation as pause points.",
          "Have the pupil read it aloud once while you record it on a phone or tablet.",
          "Play the recording back together and identify one specific area to improve (pace, expression, a mispronounced word).",
          "Have the pupil re-read the same passage aiming to fix that one specific area.",
          "Move to the stimulus-based conversation, prompting with follow-up questions to build a fuller response.",
          "Give final feedback referencing the actual PSLE marking criteria (pronunciation, fluency, content) rather than vague praise.",
        ],
      },
      {
        title: "Grammar in Context: Consolidation and Exam Editing Practice",
        strand: "Grammar in Context",
        description:
          "Consolidates every grammar point taught since P3 through timed editing practice on exam-format passages, prioritising each pupil's own recurring error types over a generic review. This is revision, not new content — use it to close gaps, not introduce fresh rules.",
        conceptExplanation:
          "By P6, a pupil has met most of the individual grammar rules they'll need (tense, agreement, prepositions, subordinate clauses) — the remaining challenge is APPLYING all of them simultaneously, under exam time pressure, within continuous prose rather than isolated practice sentences. This is why consolidation practice is structured around a personal error log rather than a generic top-to-bottom grammar review: reviewing every rule equally wastes time on things the pupil already does correctly, while a targeted approach spends limited practice time exactly where marks are actually being lost.",
        workedExamples: [
          {
            problem: "A pupil's error log shows tense-switching is their most frequent mistake. Design a targeted 10-minute drill.",
            solution: [
              "Select or write a short passage (4-5 sentences) with 2-3 deliberately planted tense-switching errors, similar to the pupil's real error pattern.",
              "Time the pupil completing it under light exam-like pressure (a visible timer, no interruptions).",
              "Mark it immediately, checking specifically whether the tense errors — the targeted weakness — were caught, separate from any other error type.",
              "If still missed, do one more short passage on tense specifically before moving to a different error type, rather than diluting the practice across many rules at once.",
            ],
          },
          {
            problem: "Full timed editing passage, one planted error: 'The students was excited about the upcoming trip, and they has packed their bags already.'",
            solution: [
              "Systematic first pass: check subject-verb agreement across the whole passage.",
              "Find 'The students was' — plural subject 'students' incorrectly paired with singular 'was' → correct to 'were'.",
              "Find 'they has' — plural pronoun 'they' incorrectly paired with singular 'has' → correct to 'have'.",
              "Corrected: 'The students were excited about the upcoming trip, and they have packed their bags already.'",
            ],
          },
        ],
        teachingSteps: [
          "Review the pupil's error log from earlier terms and pick the 1-2 error types that recur most often.",
          "Give a short, timed exam-format editing passage and have the pupil complete it under time pressure.",
          "Mark it together immediately, focusing discussion on whether the targeted recurring errors were caught this time.",
          "Reteach only the specific rule behind any error still being missed, using a fresh short example.",
          "Repeat with a second timed passage, tracking whether the targeted error type improves.",
        ],
      },
      {
        title: "Extensive Reading and Enjoyment of Language",
        strand: "Extensive Reading",
        description:
          "Deliberately protected reading-for-pleasure time with self-chosen books at the right difficulty level — the real driver of vocabulary and comprehension growth that no amount of drilling replaces. Even 10 minutes a session, kept consistent, compounds meaningfully over a term.",
        conceptExplanation:
          "Extensive reading works because vocabulary and comprehension grow mainly through repeated, wide exposure to language in engaging contexts, not through memorising word lists — a pupil who reads regularly meets thousands more words in natural context than any drilling programme could directly teach. 'Right difficulty level' matters because a book that's too hard breaks fluency and enjoyment (too much effort spent decoding, not enough left for meaning), while a book that's too easy provides little new vocabulary growth — the five-finger check (counting unknown words per page) is a simple, practical way to gauge this without formal testing. Choice matters too: self-selected books sustain motivation in a way assigned reading often doesn't, and motivation is what makes the habit stick long enough to compound.",
        workedExamples: [
          {
            problem: "Use the five-finger check to assess whether a book is at the right level for a pupil.",
            solution: [
              "Have the pupil read one full page of the book silently or aloud.",
              "Count how many words on that page the pupil doesn't know or struggles to read — put up one finger per unknown word.",
              "0-1 fingers up: likely too easy for real vocabulary growth (fine occasionally for pure enjoyment, but not ideal every time).",
              "2-4 fingers up: the right level — challenging enough for growth, not so hard that it breaks comprehension.",
              "5+ fingers up: too hard for independent reading right now — suggest an easier book or a shared-reading approach instead.",
            ],
          },
          {
            problem: "After a pupil finishes reading, ask a genuine interest question rather than a comprehension quiz — model one.",
            solution: [
              "Avoid a testing-style question like 'What happened on page 20?', which turns pleasure reading into an assessment.",
              "Ask a genuine, open question instead: 'What's happening in the story so far? Is there a character you like or dislike?'",
              "Listen and respond to the answer like a real conversation about a book, not a right/wrong check — this keeps the activity feeling like enjoyment, which is the entire point of protecting this time.",
            ],
          },
        ],
        teachingSteps: [
          "Help the pupil choose a self-selected book at an appropriate level, using a quick five-finger check (unfamiliar words per page) if unsure.",
          "Set a protected, uninterrupted reading block (even just 10 minutes) at the same point in every session.",
          "After reading, ask one genuine, open interest question ('What's happening so far? Do you like the main character?') rather than a comprehension quiz.",
          "Occasionally have the pupil read one favourite paragraph aloud and say why they picked it.",
          "Keep a simple running log of books finished to build a visible sense of progress over the term.",
        ],
      },
    ],
  },
  {
    level: "SEC1",
    topics: [
      {
        title: "Oracy: Planned Spoken Interaction and Group Discussion",
        strand: "Oracy",
        description:
          "Students take part in structured group discussions with a clear role and give short planned talks, building the self-regulation and interaction skills the Secondary EL syllabus explicitly targets from this level. Give feedback on both content and delivery (eye contact, pacing), not just what was said.",
        conceptExplanation:
          "Secondary oracy shifts emphasis toward self-regulation — managing one's own contribution length, staying on topic, and responding appropriately to others — rather than the more heavily tutor-scaffolded conversation practice of primary school. A discussion role (initiator, challenger, summariser) gives structure to this self-regulation by defining a specific communicative job, but students are now expected to fulfil that job with less moment-to-moment prompting than at P5-P6. Content and delivery are assessed as genuinely separate dimensions: content is WHAT is said (relevance, development of ideas), delivery is HOW it's said (eye contact, pace, clarity) — a well-reasoned point delivered while staring at notes with no eye contact still loses marks on delivery specifically.",
        workedExamples: [
          {
            problem: "As 'challenger' in a discussion on 'Should homework be banned?', model a respectful challenge to a point already made.",
            solution: [
              "Acknowledge the previous speaker's point specifically, rather than ignoring it and making an unrelated point: 'You said homework helps reinforce learning...'",
              "Introduce the challenge with a clear signal word: '...but I'd push back on that, because...'",
              "Complete the challenge with a specific reason, not just disagreement: '...students who are already struggling in class often find homework adds stress without actually helping them understand the material better.'",
              "Confirm the challenge engages directly with the specific point made, rather than restating a generic opposing position.",
            ],
          },
          {
            problem: "Plan a 2-minute talk on 'A Skill I'd Like to Learn' using only 3 brief notes, not a script.",
            solution: [
              "Choose the skill and note exactly 3 points, each just a few words: e.g. 'skill = photography / why: capture memories creatively / first step: learn camera basics'.",
              "Practise speaking from only these notes, expanding each point aloud in the moment rather than reading a memorised script — this is what 'planned but not scripted' means in practice.",
              "Self-check delivery separately from content afterward: did I maintain eye contact and a steady pace, independent of whether the content itself was strong?",
            ],
          },
        ],
        teachingSteps: [
          "Assign discussion roles (initiator, challenger, summariser) for a small-group discussion on a familiar issue.",
          "Model a planned 1-2 minute talk yourself, briefly narrating your own planning process (opening, 2 points, closing).",
          "Have students plan their own short talk using only brief notes, not a full script.",
          "Run the group discussion, coaching students in the moment on delivery (eye contact, pacing) as well as content.",
          "Give feedback that names one strength and one specific improvement for both content and delivery separately.",
        ],
      },
      {
        title: "Reading and Viewing: Narrative and Descriptive Texts",
        strand: "Reading and Viewing",
        description:
          "Students read longer, more complex narrative and descriptive texts than at PSLE, analysing how word choice and structure create effect rather than just following the plot. Push students to say *how* a technique works, not just name it.",
        conceptExplanation:
          "Literary analysis at secondary level moves from comprehension (what happens) to appreciation (how the writing achieves its effect) — naming a technique ('this is a metaphor') is only the first half of the skill; the second, harder half is explaining specifically HOW that technique creates a particular effect on the reader in that exact moment. This 'how' explanation must connect the specific words used to a specific reader response (tension, sympathy, humour, unease), not just assert an effect without justifying it from the text. This two-part answer structure (name the technique, then explain its specific effect) is the foundation for every literary analysis task through to O-Level.",
        workedExamples: [
          {
            problem: "'The silence pressed down on the empty house like a physical weight.' Name the technique and explain its effect.",
            solution: [
              "Name the technique: this is a simile, comparing the silence to 'a physical weight' using 'like'.",
              "Explain HOW it works: comparing an abstract, intangible thing (silence) to something concrete and heavy (a physical weight) makes the silence feel oppressive and almost suffocating, rather than simply 'quiet'.",
              "Explain the specific effect on the reader: it creates a sense of unease or dread appropriate to an empty house, making the reader feel the tension of the scene rather than just being told the house is quiet.",
            ],
          },
          {
            problem: "A student writes: 'The writer uses personification to describe the storm.' What's missing from this answer?",
            solution: [
              "Recognise the technique has been correctly named (personification), but the answer stops there.",
              "Identify what's missing: no quotation of the specific words used, and no explanation of the effect on the reader.",
              "A complete answer would add: 'for example, \"the wind howled its fury\" — giving the wind a human emotion (fury) makes the storm feel deliberately menacing and alive, rather than a neutral natural event, heightening the danger the characters face.'",
            ],
          },
        ],
        teachingSteps: [
          "Read a passage and identify one moment where word choice or structure creates a clear effect (tension, sympathy, humour).",
          "Ask students to name the technique used, then push further with 'how exactly does this create that effect?'",
          "Model writing a two-part answer: name the technique, then explain its effect on the reader.",
          "Have students find and analyse one more technique in the same passage using the same two-part structure.",
          "Compare a few students' analyses, checking each one explains the effect rather than stopping at naming the device.",
        ],
      },
      {
        title: "Writing and Representing: Narrative and Descriptive Writing",
        strand: "Writing and Representing",
        description:
          "Raises narrative and descriptive writing to secondary standard — more deliberate structure, pacing and sensory detail — as a foundation before argumentative and expository writing are introduced. A strong opening line is worth drilling on its own; it's often what separates a mediocre response from a good one.",
        conceptExplanation:
          "Pacing means deliberately controlling how much narrative time is spent on each part of a story — slowing down (more sentences, more sensory detail) for the moments that matter most (the climax, a key emotional beat) and speeding up (summarising quickly) for less important connecting events, rather than giving every moment equal weight. An opening line's job is to immediately establish intrigue, voice, or stakes rather than simply starting the timeline ('It was a normal day' vs. 'The letter on the doormat was addressed to someone who had died three years ago') — a strong opener earns the reader's continued attention, which matters even more once compositions get longer and readers (or markers) form an impression within the first sentence or two.",
        workedExamples: [
          {
            problem: "Compare these two openers for the same story and identify which is stronger and why: (A) 'One day I went to the beach with my family.' (B) 'The message in the bottle had been waiting fifty years for someone to find it.'",
            solution: [
              "Assess opener A — it's a plain, chronological start with no intrigue, tension or distinctive voice; it tells the reader almost nothing worth being curious about.",
              "Assess opener B — it immediately raises a question (who sent it? what does it say? why fifty years?) and implies a specific, unusual object at the centre of the story.",
              "Conclusion: opener B is stronger because it creates immediate curiosity and stakes, giving the reader a reason to keep reading, whereas opener A is a generic time-stamp that could open almost any story.",
            ],
          },
          {
            problem: "Plan pacing across a story about winning a competition: which moments deserve more sentences and detail, and which should be summarised quickly?",
            solution: [
              "Identify the climax — the moment of winning (or the final attempt) — as deserving the MOST detail and sensory description, since it's the emotional peak.",
              "Identify routine preparation events (practising, travelling to the venue) as lower priority — these can be summarised in one or two sentences rather than described in full scenes.",
              "Plan accordingly: 1-2 sentences for the journey there, a short paragraph for waiting/nerves, then several detailed sentences slowing down at the actual winning moment before a brief resolution.",
            ],
          },
        ],
        teachingSteps: [
          "Read 2-3 strong opening lines from model texts and discuss what makes each one grab attention.",
          "Have students draft 3 different opening lines for the same story idea, trying different techniques (action, dialogue, description).",
          "Select the strongest opener together and discuss why it works best for this particular story.",
          "Model planning pacing across the story — where to slow down for detail, where to speed up — on a simple timeline.",
          "Guide students to draft their story from the chosen opener, checking pacing against the planned timeline as they go.",
          "Review one paragraph for sensory/descriptive detail, upgrading at least one generic sentence together.",
        ],
      },
      {
        title: "Grammar in Context: Accuracy in Complex Sentences",
        strand: "Grammar in Context",
        description:
          "Focuses on accuracy in more complex sentence structures — multiple clauses, correct punctuation of them — using students' own writing as the primary error source rather than generic drills. Correcting a student's own sentence sticks far better than correcting someone else's.",
        conceptExplanation:
          "A complex sentence contains a main clause (a complete idea on its own) and one or more subordinate clauses (which cannot stand alone), and the punctuation rules depend on where the subordinate clause sits: a comma is typically needed when a subordinate clause comes BEFORE the main clause ('Although it rained, we continued') but is often omitted when it comes AFTER ('We continued although it rained'). Multi-clause sentences with several ideas linked together additionally risk comma splices (joining two complete sentences with only a comma, which is a punctuation error) or run-ons (no punctuation at all between complete ideas) — both are exactly the errors that increase as students attempt more ambitious sentence structures, which is why accuracy work matters most right when sentence complexity is also increasing.",
        workedExamples: [
          {
            problem: "Fix the punctuation error: 'The team had trained for months, they were still nervous before the match.'",
            solution: [
              "Identify that both halves ('The team had trained for months' and 'they were still nervous before the match') are complete sentences on their own.",
              "Recognise this as a comma splice — two complete sentences joined only by a comma, which is a punctuation error.",
              "Fix by either adding a conjunction ('...months, but they were still nervous...'), or splitting into two sentences with a full stop, or using a semicolon: 'The team had trained for months; they were still nervous before the match.'",
            ],
          },
          {
            problem: "Punctuate correctly: 'Since the exam results were released the whole class has been anxious.'",
            solution: [
              "Identify the subordinate clause — 'Since the exam results were released' — which cannot stand alone as a complete sentence.",
              "Note it comes BEFORE the main clause ('the whole class has been anxious'), which is the position requiring a comma.",
              "Corrected: 'Since the exam results were released, the whole class has been anxious.'",
            ],
          },
        ],
        teachingSteps: [
          "Pull one genuinely complex sentence from the student's own recent writing that has a punctuation or clause error.",
          "Diagram or colour-code the clauses in that sentence together to see where the structure breaks down.",
          "Model the corrected version, explaining the specific punctuation rule that applies.",
          "Have the student find a second sentence of their own with a similar structure and self-correct it using the same rule.",
          "Give one fresh multi-clause sentence to punctuate correctly as an independent check.",
        ],
      },
      {
        title: "Introduction to Expository Writing",
        strand: "Writing and Representing",
        description:
          "Students write their first expository pieces — explaining a process or topic clearly and objectively — learning to organise ideas under clear paragraph topics rather than a narrative timeline. Contrast an expository paragraph against a narrative one from the same topic to make the structural difference visible.",
        conceptExplanation:
          "Expository writing organises ideas by TOPIC — each paragraph covers one distinct aspect of the subject, signalled by a topic sentence stating that paragraph's focus — rather than by chronological time, which is how narrative writing is organised. This is a genuinely different planning process: instead of asking 'what happens next in time?', an expository writer asks 'what is the next distinct idea or aspect I need to cover?' Objectivity means presenting information without inserting personal opinion or emotional language, which is a different voice from the personal, often emotionally engaged voice of narrative writing — students moving from years of narrative practice often need explicit practice suppressing that instinct.",
        workedExamples: [
          {
            problem: "Plan expository paragraph topics for 'How Smartphones Have Changed Communication' (not a narrative timeline).",
            solution: [
              "Reject a chronological/narrative plan (e.g. 'first phones were invented, then...') in favour of topic-based paragraphs.",
              "Identify distinct aspects/topics: speed of communication, types of communication (text, video, social media), and impact on face-to-face interaction.",
              "Plan one paragraph per topic, each with its own topic sentence: Paragraph 1 - speed; Paragraph 2 - variety of methods; Paragraph 3 - effect on in-person interaction.",
              "Confirm each paragraph stays focused on its single stated topic rather than drifting into another paragraph's territory.",
            ],
          },
          {
            problem: "Identify and fix the drift in this expository paragraph: 'Recycling helps the environment by reducing waste in landfills. I remember when my school organised a recycling drive and I felt so proud collecting cans with my friends.'",
            solution: [
              "Identify the topic sentence's stated focus: recycling reducing landfill waste — an objective, factual claim.",
              "Identify where the paragraph drifts — the second sentence shifts into a personal narrative anecdote ('I remember... I felt so proud'), which is off-topic for an expository paragraph and introduces a narrative voice.",
              "Fix by replacing the drifted sentence with one that stays on the stated topic: 'For example, recycling one tonne of paper can save significant landfill space and reduce the need for new raw materials.'",
            ],
          },
        ],
        teachingSteps: [
          "Show a narrative paragraph and an expository paragraph on the same topic side by side, identifying the structural difference.",
          "Model planning an expository piece using clear topic-based paragraphs (not a story timeline), one main idea per paragraph.",
          "Have students choose a familiar process or topic and list 3-4 paragraph topics before writing anything.",
          "Guide students to draft one paragraph, checking it stays focused on its single topic sentence.",
          "Review the draft together, flagging any sentence that has drifted into narrative or off-topic territory.",
        ],
      },
      {
        title: "Vocabulary and Register Awareness",
        strand: "Reading and Viewing",
        description:
          "Introduces the idea of register — that word choice changes with audience and purpose — comparing informal and formal versions of the same message. This groundwork pays off directly when situational writing's tone demands show up again at O-Level.",
        conceptExplanation:
          "Register refers to the level of formality and the specific word/phrase choices appropriate to a given audience and purpose — the SAME underlying message can be expressed in registers ranging from very casual (texting a close friend) to very formal (writing to an unfamiliar authority figure), and choosing correctly is itself a communication skill, not just a grammar rule. Register awareness at secondary level moves beyond the simple formal/informal binary introduced at P6 into recognising a wider range of registers and the specific vocabulary signals of each (slang and contractions signal informal; passive voice and precise vocabulary often signal formal). This groundwork is essential preparation for O-Level situational writing, which explicitly assesses whether tone matches the specified audience.",
        workedExamples: [
          {
            problem: "Rewrite this informal message in a formal register appropriate for emailing a teacher: 'Hey, can't make it to class tmrw, not feeling well.'",
            solution: [
              "Identify informal markers: 'Hey' (casual greeting), 'can't' (contraction), 'tmrw' (text abbreviation).",
              "Replace with formal equivalents: a proper greeting ('Dear Mr Tan,'), no contractions ('I will not be able to'), no abbreviations ('tomorrow').",
              "Rewritten: 'Dear Mr Tan, I am writing to inform you that I will not be able to attend class tomorrow as I am unwell.'",
              "Confirm the core message (absence, reason) is unchanged — only the register has shifted to match the audience.",
            ],
          },
          {
            problem: "Identify which register (formal or informal) fits each scenario: (A) texting a friend about weekend plans, (B) writing a letter of complaint to a company.",
            solution: [
              "Scenario A — audience is a close friend, purpose is casual social planning → informal register (contractions, casual vocabulary appropriate).",
              "Scenario B — audience is an unfamiliar company representative, purpose is a formal complaint → formal register (no contractions, polite indirect phrasing, professional vocabulary).",
              "Confirm the register choice follows from WHO the audience is and WHAT the purpose is, the two factors that determine register in every scenario.",
            ],
          },
        ],
        teachingSteps: [
          "Show the same message written informally (to a friend) and formally (to a teacher) side by side.",
          "List the specific word and phrase differences that signal each register.",
          "Give students a formal sentence and have them rewrite it informally, and vice versa, checking the meaning stays the same.",
          "Discuss 2-3 scenarios and have students identify which register would be appropriate and why.",
          "Have students write one short message twice, once in each register, for a scenario of their choice.",
        ],
      },
    ],
  },
  {
    level: "SEC2",
    topics: [
      {
        title: "Oracy: Persuasive Speaking and Presentation Skills",
        strand: "Oracy",
        description:
          "Students plan and deliver a short persuasive talk, working on speaking confidently, clearly and with intent to convince rather than just inform. Have peers note one thing that was persuasive and one thing that could be stronger — genuine peer feedback, not just applause.",
        conceptExplanation:
          "Persuasive speaking differs from informative speaking in intent: the goal isn't just to convey information accurately but to move the listener toward a specific belief or action, which requires deliberate persuasive techniques — a clear, confident claim; supporting evidence or examples; and often a call to action at the end. Confidence in delivery (steady pace, controlled volume, sustained eye contact) genuinely affects how persuasive a talk feels, independent of its logical content, because audiences are influenced by HOW conviction is communicated, not only by the argument's logic. Structured peer feedback (one specific strength, one specific improvement) is more useful than general praise because it gives the speaker something concrete and actionable to work on for next time.",
        workedExamples: [
          {
            problem: "Model the opening of a persuasive talk arguing school should start later, including a strong claim and a call to action.",
            solution: [
              "Open with a clear, confident claim, not a hedge: 'School should start at least one hour later than it currently does.'",
              "Support it immediately with a concrete reason or example, not just assertion: 'Research shows teenagers' natural sleep cycles mean most students are chronically sleep-deprived under the current schedule, which affects concentration and mood.'",
              "Plan a closing call to action for later in the talk: 'I urge the school to trial a later start time for even one term, and see the difference for yourselves.'",
              "Confirm the claim, evidence and call to action are all clearly identifiable as distinct parts, not blended into vague general statements.",
            ],
          },
          {
            problem: "Give structured peer feedback (one strength, one improvement) on a talk that had strong content but was read entirely from notes with no eye contact.",
            solution: [
              "Identify one genuine strength specifically, not generically: 'Your argument about sleep research was really convincing and well-explained.'",
              "Identify one specific, actionable improvement rather than a vague criticism: 'Try looking up from your notes at the audience at least during your opening and closing lines, since reading the whole time made it harder to feel convinced.'",
              "Confirm both pieces of feedback are specific enough that the speaker knows exactly what to keep doing and exactly what to change next time.",
            ],
          },
        ],
        teachingSteps: [
          "Model a short persuasive talk yourself, explicitly narrating the persuasive techniques used (a strong claim, an example, a call to action).",
          "Have students choose a position on a familiar issue and outline 2-3 supporting points before speaking.",
          "Coach delivery specifically — pace, volume, eye contact — as students rehearse in pairs.",
          "Have each student deliver their talk to a small group, with listeners assigned to note one persuasive strength and one area to strengthen.",
          "Debrief using the peer notes, having students identify one specific change they'd make for a second attempt.",
        ],
      },
      {
        title: "Reading and Viewing: Expository and Argumentative Texts",
        strand: "Reading and Viewing",
        description:
          "Students analyse expository and argumentative texts for the writer's stance, supporting evidence and any bias, a step up from the narrative-focused reading of Sec 1. Ask students to find the sentence that best states the writer's main argument — a quick, diagnostic exercise.",
        conceptExplanation:
          "A writer's 'stance' is their position or attitude toward the topic, which in argumentative writing is usually explicitly stated (often in a thesis-like sentence) but can be more subtly conveyed in expository writing through word choice and emphasis. Evidence supporting a stance falls into different types — facts (verifiable data), expert opinion (citing an authority), and examples/anecdotes (illustrative but not necessarily generalisable) — and recognising which type is used affects how strong the evidence actually is. Bias means one-sided presentation: omitting counter-evidence, using emotionally loaded language, or over-relying on weak evidence types — spotting bias is what separates critical reading from simply accepting a text's argument at face value.",
        workedExamples: [
          {
            problem:
              "'Fast food is destroying our health. Everyone knows fried food is bad for you, and restaurants only care about profit, not customers' wellbeing.' Identify the stance and one sign of bias.",
            solution: [
              "Identify the stance: the writer is strongly against fast food, framing it as actively harmful ('destroying our health').",
              "Look for evidence type — 'everyone knows' is not actual evidence, just an unsupported generalisation presented as fact.",
              "Identify bias: the claim that restaurants 'only care about profit, not customers' wellbeing' is a sweeping, emotionally loaded generalisation with no supporting evidence, and it ignores any possible counterpoint (e.g. some restaurants offering healthier options).",
              "Conclusion: the passage shows bias through unsupported generalisations and loaded language, rather than balanced, evidenced argument.",
            ],
          },
          {
            problem:
              "Find the sentence that best states the writer's main argument: 'Cities are growing rapidly. Traffic congestion has increased. Public transport ridership has also risen. Ultimately, investing in public transport infrastructure is the most effective solution to urban congestion.'",
            solution: [
              "Scan for factual/descriptive sentences (context-setting) versus a sentence making an actual claim or judgement.",
              "The first three sentences are factual context (growth, congestion, ridership) — none states an argument, only observations.",
              "The final sentence ('investing in public transport infrastructure is the most effective solution') makes a clear evaluative claim — this is the main argument.",
              "Confirm by checking the signal word 'Ultimately,' which often flags a concluding, argument-stating sentence.",
            ],
          },
        ],
        teachingSteps: [
          "Read the text and ask students to underline the single sentence that best states the writer's main argument.",
          "Compare underlined sentences as a group, discussing why some choices are closer to the true main argument than others.",
          "Identify 2-3 pieces of supporting evidence the writer uses, checking whether each one is fact, expert opinion, or example.",
          "Discuss any signs of bias — one-sided evidence, loaded language — and how it affects how persuasive the piece feels.",
          "Have students write a one-sentence summary of the writer's stance in their own words, checking it's accurate and unbiased.",
        ],
      },
      {
        title: "Writing and Representing: Introduction to Argumentative Writing",
        strand: "Writing and Representing",
        description:
          "Students write their first argumentative pieces, structuring a clear position with supporting points and at least one acknowledged counterpoint. The counterpoint is the part students most often skip — insist on it, since it's what separates a one-sided rant from a real argument.",
        conceptExplanation:
          "A genuine argumentative essay does more than list reasons supporting one side — it acknowledges the strongest opposing view (the counterpoint) and explains why the writer's position still holds despite it, which demonstrates the writer has actually considered the issue rather than just asserting an opinion. Skipping the counterpoint produces what reads as a one-sided rant, which is less persuasive to a critical reader precisely because it seems to not have considered obvious objections. The standard structure is: state position, give 2-3 supporting points with evidence, acknowledge the strongest counterpoint honestly (not a weak strawman version of it), then rebut it — explain specifically why the position still stands despite that objection.",
        workedExamples: [
          {
            problem: "Write a counterpoint-and-rebuttal paragraph for the position 'School uniforms should be compulsory,' acknowledging the objection that uniforms restrict self-expression.",
            solution: [
              "State the counterpoint honestly and fairly, not as a weak strawman: 'Some argue that uniforms restrict students' ability to express their individuality through clothing.'",
              "Acknowledge it has real merit, rather than dismissing it instantly: 'This is a valid concern, as clothing is one way young people explore their identity.'",
              "Rebut with a specific reason the position still holds despite this: 'However, uniforms reduce visible economic inequality between students and minimise distractions and peer pressure around fashion, benefits that outweigh the loss of one specific form of self-expression, especially since students still have other avenues — hairstyles, accessories, hobbies — to express individuality.'",
            ],
          },
          {
            problem: "Identify what's missing from this argumentative paragraph (no counterpoint present): 'Social media should be banned for under-16s. It causes anxiety and depression. It exposes young people to harmful content. It wastes valuable study time.'",
            solution: [
              "Check whether any opposing view is acknowledged anywhere in the paragraph — none is; it's a list of one-sided reasons only.",
              "Identify this as the specific gap: a real counterpoint (e.g. social media also helps young people stay connected with friends, or provides access to educational content) is entirely absent.",
              "Note the fix: adding one acknowledged counterpoint with a rebuttal would strengthen the argument by showing the writer has genuinely weighed both sides.",
            ],
          },
        ],
        teachingSteps: [
          "Choose a familiar debatable topic and have students state their position in one clear sentence.",
          "Brainstorm 2-3 supporting points for their position, then explicitly brainstorm the strongest opposing view too.",
          "Model writing one paragraph that acknowledges the counterpoint before explaining why the writer's position still stands.",
          "Have students plan their own essay with a position, 2 supporting points and one acknowledged counterpoint paragraph.",
          "Guide students to draft the counterpoint paragraph first, since it's the part most often skipped or rushed.",
          "Review the full draft, checking the counterpoint is genuinely addressed, not just mentioned and dismissed.",
        ],
      },
      {
        title: "Grammar in Context: Editing and Cohesive Devices",
        strand: "Grammar in Context",
        description:
          "Builds editing skill on continuous prose (spotting and fixing planted errors) alongside more sophisticated cohesive devices for linking paragraphs, not just sentences. Time-box editing practice — the O-Level editing component is done under time pressure, so accuracy-under-speed matters.",
        conceptExplanation:
          "Editing continuous prose is harder than isolated fill-in-the-blank grammar exercises because errors must be FOUND (not just fixed once identified) within otherwise-correct surrounding text, which requires sustained attention rather than knowing a rule in isolation — this is why a systematic, multi-pass reading method (one pass per error category) outperforms a single read-through trying to catch everything at once. Paragraph-level cohesive devices ('in addition,' 'however,' 'as a result,' 'in contrast') signal the logical relationship between one paragraph's idea and the next, functioning at a larger scale than the sentence-level conjunctions taught earlier — choosing the wrong one can make two correctly-written paragraphs feel disconnected or even contradictory.",
        workedExamples: [
          {
            problem: "Time-box a 5-minute editing passage: what systematic approach should the student use rather than one general read-through?",
            solution: [
              "Allocate the 5 minutes into 2-3 focused passes rather than one unfocused read: e.g. pass 1 (90 seconds) checking only tense/agreement, pass 2 (90 seconds) checking only spelling and punctuation, pass 3 (remaining time) a final general check.",
              "Within each pass, read for that ONE error type only, resisting the urge to fix other errors noticed along the way until their dedicated pass.",
              "This systematic approach catches more errors under time pressure than trying to spot every error type simultaneously in one read, since divided attention across many rules at once causes some to be missed.",
            ],
          },
          {
            problem: "Choose the best cohesive device to link these two paragraph ideas: Paragraph 1 ends with 'Online learning offers flexibility that traditional classrooms cannot match.' Paragraph 2 begins with '___, it also has significant drawbacks, such as reduced social interaction.'",
            solution: [
              "Identify the logical relationship between the two paragraphs — paragraph 1 praises online learning, paragraph 2 is about to raise a downside, which is a relationship of contrast.",
              "Reject 'In addition,' which signals agreement/continuation, not contrast.",
              "Choose 'However,' which correctly signals the contrasting turn: 'However, it also has significant drawbacks, such as reduced social interaction.'",
            ],
          },
        ],
        teachingSteps: [
          "Give a timed editing passage (set a visible timer) and have the student complete it under realistic time pressure.",
          "Review errors found versus missed, discussing which error types were rushed past.",
          "Introduce a paragraph-linking cohesive device (e.g. 'in addition,' 'however,' 'as a result') not yet used in the student's writing.",
          "Show a two-paragraph example and model inserting the linking device at the paragraph boundary, explaining the logical relationship it signals.",
          "Have the student insert an appropriate cohesive device between two of their own paragraphs, justifying the choice.",
        ],
      },
      {
        title: "Critical Viewing: Visual and Multimodal Texts",
        strand: "Reading and Viewing",
        description:
          "Extends critical reading to visual and multimodal texts (adverts, infographics, comic panels), asking students to read how images, layout and text work together to create meaning. This directly builds the visual-stimulus reading skill situational writing later demands.",
        conceptExplanation:
          "A multimodal text combines multiple communication modes (image, text, layout, colour) that work TOGETHER to create meaning — none of these elements should be read in isolation, since the image might convey an emotion the text doesn't state directly, or the layout might direct attention to a specific element the designer wants noticed first. Layout choices (size, position, colour contrast) are deliberate design decisions that guide the viewer's eye in a specific order, usually toward the most persuasively important element first (often the largest or most colour-contrasted item). Understanding how these elements combine is directly transferable to situational writing, which regularly provides a visual stimulus that students must read accurately before responding.",
        workedExamples: [
          {
            problem: "An advert shows a large, bright image of a smiling family eating together, with small text below reading 'Family Restaurant — 20% off this week.' Analyse how image and text work together.",
            solution: [
              "Identify what the image alone communicates before reading any text — warmth, togetherness, happiness associated with the setting.",
              "Note the layout: the image is large and dominant, the text is small — meaning the emotional appeal (family happiness) is prioritised over the factual discount information.",
              "Explain how they work together: the image creates an emotional association with the restaurant (family, joy) that the text alone couldn't achieve, while the text provides the concrete, actionable detail (the discount) the image alone couldn't convey — together they combine emotional appeal with a practical incentive.",
            ],
          },
          {
            problem: "Identify the intended audience of an infographic using bright colours, simple icons, and short bullet-point facts about recycling, displayed in a primary school hallway.",
            solution: [
              "Consider the visual style — bright colours and simple icons suggest a younger or general audience rather than a specialist/academic one.",
              "Consider the text style — short bullet points rather than dense paragraphs suggest quick, accessible reading rather than in-depth analysis.",
              "Consider the placement — a primary school hallway strongly signals the intended audience is young students.",
              "Conclusion: the visual and textual choices together indicate the infographic targets young children, and every design choice (simplicity, brightness, brevity) is specifically suited to that audience.",
            ],
          },
        ],
        teachingSteps: [
          "Show a multimodal text (advert or infographic) and ask what the image alone communicates before reading any words.",
          "Discuss how the layout (size, position, colour) draws the eye to a particular element first.",
          "Identify how the text and image work together — does the text repeat the image's message, or add something new?",
          "Have students analyse a second multimodal text independently, answering the same three questions (image message, layout, text-image relationship).",
          "Discuss who the intended audience is and how the visual choices target that audience specifically.",
        ],
      },
      {
        title: "Vocabulary Expansion for Formal Writing",
        strand: "Reading and Viewing",
        description:
          "A dedicated push on more precise, formal vocabulary suited to expository and argumentative writing, replacing vague words ('good', 'bad', 'a lot') with more exact alternatives. A simple 'upgrade this word' exercise on a student's own draft works better than a standalone word list.",
        conceptExplanation:
          "Precise vocabulary communicates a specific shade of meaning that a vague word cannot — 'significant' conveys something different from 'huge' or 'noticeable,' even though all three could loosely replace 'a lot,' and choosing the wrong shade of meaning can misrepresent the writer's actual point. Formal academic vocabulary tends to favour more precise, often Latin/Greek-derived words over casual everyday synonyms (e.g. 'substantial' or 'considerable' rather than 'a lot,' 'detrimental' rather than 'bad') because precision and formality reinforce each other in expository and argumentative contexts. Working from a student's OWN vague words (rather than a generic list) is more effective because it directly targets habits already visible in their real writing, making the improvement concrete and immediately applicable.",
        workedExamples: [
          {
            problem: "Upgrade the vague word in: 'Climate change has caused a lot of problems for coastal cities.'",
            solution: [
              "Identify the vague phrase: 'a lot of problems' — doesn't specify scale, type, or severity.",
              "Consider what shade of meaning is actually intended — is it minor inconvenience, or serious, significant harm?",
              "Choose a precise alternative matching the intended severity: 'significant challenges' or 'severe consequences,' depending on the intended emphasis.",
              "Rewritten: 'Climate change has caused significant challenges for coastal cities' — now the reader understands the intended severity, not just an unspecified quantity.",
            ],
          },
          {
            problem: "A student's essay repeatedly uses 'bad' (e.g. 'bad effects,' 'bad for the economy,' 'bad decision'). Suggest 3 more precise alternatives for different contexts.",
            solution: [
              "For 'bad effects' on health or environment, consider 'detrimental' or 'harmful' — precise words for negative impact.",
              "For 'bad for the economy,' consider 'damaging' or 'costly' — words specific to economic harm.",
              "For 'bad decision,' consider 'misguided' or 'ill-advised' — words specific to judgement/reasoning quality.",
              "Confirm each alternative was chosen to match its SPECIFIC context, rather than picking one single replacement word to use everywhere 'bad' previously appeared.",
            ],
          },
        ],
        teachingSteps: [
          "Scan a piece of the student's own recent writing for 2-3 vague words (good, bad, a lot, nice).",
          "For each vague word, brainstorm 3-4 more precise alternatives and discuss the shade of meaning each one adds.",
          "Model swapping one vague word in the student's draft for the most precise alternative, checking it still fits the sentence.",
          "Have the student upgrade the remaining vague words themselves, checking each choice against the intended meaning.",
          "Read the upgraded paragraph aloud and discuss how much more precise and formal it now sounds.",
        ],
      },
    ],
  },
  {
    level: "SEC3",
    topics: [
      {
        title: "Paper 1 Editing: Grammatical Accuracy in Continuous Prose",
        strand: "Grammar in Context",
        description:
          "Introduces the O-Level editing task format directly: a passage of roughly 250 words containing planted grammar and spelling errors for students to identify and correct. Teach a systematic read-through method (checking tense, then agreement, then spelling) rather than random scanning.",
        conceptExplanation:
          "The O-Level Paper 1 editing task presents a continuous passage with a fixed number of errors (typically drawn from a defined set of categories: verb tense/form, subject-verb agreement, spelling, word choice), each requiring the student to identify the wrong word and supply the correction — random scanning is inefficient because it relies on an error 'jumping out,' which subtle grammar errors often don't do. A systematic multi-pass method works because each pass narrows attention to ONE specific category, making errors in that category far more noticeable than when attention is divided across all possible error types simultaneously — this trades a small amount of extra time for a large gain in detection accuracy.",
        workedExamples: [
          {
            problem: "Apply the three-pass method to find the error in: 'By the time the ambulance arrive, the injured man was already unconscious.'",
            solution: [
              "Pass 1 (tense check): 'By the time the ambulance arrive' — the surrounding context ('was already unconscious,' past tense) signals this whole sentence is in the past, but 'arrive' is present tense, not matching.",
              "Identify the specific error: 'arrive' should be 'arrived' to match the established past-tense narrative.",
              "Corrected: 'By the time the ambulance arrived, the injured man was already unconscious.'",
              "Confirm this was caught specifically because the tense-focused pass was looking for exactly this type of mismatch, not because it visually 'looked wrong' on a casual read.",
            ],
          },
          {
            problem: "Apply the agreement-check pass to find the error in: 'Neither of the two options were satisfactory to the committee.'",
            solution: [
              "Identify the true grammatical subject — 'Neither' (singular), not 'options' (plural), even though 'options' sits closer to the verb.",
              "Check the verb 'were' — it incorrectly agrees with the nearby plural noun rather than the true singular subject 'Neither'.",
              "Corrected: 'Neither of the two options was satisfactory to the committee.'",
            ],
          },
        ],
        teachingSteps: [
          "Introduce the O-Level editing task format and its scoring, showing a sample answer sheet layout.",
          "Model the systematic method: one read-through checking only tense, a second checking only subject-verb agreement, a third checking spelling.",
          "Work through one full 250-word passage together using the systematic method, narrating each pass aloud.",
          "Have the student attempt a second passage independently using the same three-pass method under light time pressure.",
          "Mark together, checking whether errors were missed because a pass was skipped or rushed.",
        ],
      },
      {
        title: "Situational Writing: Practical Text Types",
        strand: "Writing and Representing",
        description:
          "Covers the O-Level situational writing range — emails, blog entries, reports and similar practical formats — in the full 250–350 word length, responding to a visual and written stimulus. Task fulfilment and appropriate tone are marked as heavily as language accuracy.",
        conceptExplanation:
          "O-Level situational writing is marked across three broad areas of roughly equal weight — content/task fulfilment (all required points covered), language (grammar, vocabulary, register), and organisation (logical structure, appropriate format conventions) — meaning a response strong in only one area is capped well below full marks. At this length (250-350 words), simply listing content points is not enough; each point needs to be developed with enough detail to feel substantive, while a checklist approach ensures nothing required is missed under the format's specific conventions. The visual stimulus is not decorative — it typically contains information (numbers, images, labels) that must be incorporated accurately into the response, and misreading it is a common, avoidable source of lost marks.",
        workedExamples: [
          {
            problem:
              "Stimulus: a poster advertising a school's 'Green Week' event, showing dates (12-16 March), activities (recycling drive, tree-planting), and a request for volunteers. Brief: write a blog entry informing students about the event. List the content points to check off.",
            solution: [
              "Extract every distinct piece of information from the stimulus: the event name (Green Week), the dates (12-16 March), the specific activities listed (recycling drive, tree-planting), and the volunteer call-to-action.",
              "Note the format is a blog entry, which typically allows a more engaging, slightly informal-but-still-appropriate tone compared to a formal report.",
              "Plan the response to cover every extracted point with enough development (not just a bare list) — e.g. explaining briefly why each activity matters, not just naming it.",
              "Confirm all extracted points, plus correct dates matching the stimulus exactly, appear somewhere in the final draft.",
            ],
          },
          {
            problem: "A student's draft blog entry gives the Green Week dates as '12-15 March' when the stimulus clearly states '12-16 March.' Why does this matter?",
            solution: [
              "Recognise this as a content accuracy error, not just a minor typo — the stimulus is a source document the response must represent correctly.",
              "Understand that misreporting stimulus information (even a single date) is marked as a content/task fulfilment error, since accurately reflecting given information is part of the task.",
              "Confirm the fix: always cross-check numerical or factual details against the stimulus directly before finalising, rather than relying on memory while drafting.",
            ],
          },
        ],
        teachingSteps: [
          "Read the stimulus material together, listing every content point the brief requires as a checklist.",
          "Identify the required text type (email, blog entry, report) and its specific format conventions.",
          "Discuss the target audience and appropriate tone, referencing the register work from Sec1-2.",
          "Model planning the response as one point per paragraph, mapped directly against the checklist.",
          "Have the student draft the full 250-350 word response, checking off checklist points as they're included.",
          "Review the draft against both the content checklist and the tone/format conventions before finalising.",
        ],
      },
      {
        title: "Continuous Writing: Narrative and Expository Options",
        strand: "Writing and Representing",
        description:
          "Students practise choosing well from the four continuous writing topic options and writing 350–500 words of sustained narrative or expository prose. Spend real time on topic selection strategy — many students lose marks simply by picking a topic they can't sustain for 500 words.",
        conceptExplanation:
          "O-Level continuous writing offers several topic options (often a mix of narrative prompts and expository/argumentative ones), and topic selection is itself a skill — a 'sustainable' topic is one where the student can genuinely generate 350-500 words of developed, relevant content, not just an idea that sounds appealing in the first few seconds. A common failure pattern is choosing a topic based on initial interest without checking whether there's enough substance to sustain it, leading to padding, repetition, or an underdeveloped ending once ideas run out partway through. Evaluating a topic quickly means asking: can I picture at least 3-4 distinct, developed points/scenes for this, not just one central idea repeated in different words.",
        workedExamples: [
          {
            problem: "Evaluate whether 'Write about a time you learned an important lesson' is sustainable, and plan it if so.",
            solution: [
              "Check for sustainability by asking: can this generate distinct sections — a clear before, a specific incident, a clear after/lesson? Yes, this structure naturally supports 3+ distinct parts.",
              "Plan the distinct sections: (1) the situation before the lesson, showing the character's initial (flawed) mindset, (2) the specific incident that challenged it, (3) the realisation and change, (4) how the lesson affected them afterward.",
              "Confirm each section can be developed with specific detail (not just summarised in one sentence), which is what makes 350-500 words achievable without padding.",
            ],
          },
          {
            problem: "A student wants to write about 'My Favourite Season' as a continuous writing topic — evaluate this choice.",
            solution: [
              "Check for sustainability — a single static preference ('I like summer because it's warm') risks running out of substance quickly, since there's no natural narrative or developing structure.",
              "Consider whether it could be reshaped into something sustainable — e.g. narrating one specific, vivid memory FROM that season rather than describing the season generically, which would add narrative structure and specific detail.",
              "Conclusion: as a bare descriptive topic it's risky and likely to run short or become repetitive; reshaping it into a specific narrative anchored in one memory would make it far more sustainable.",
            ],
          },
        ],
        teachingSteps: [
          "Present a set of four sample topic options and model thinking aloud through the selection process for each.",
          "Discuss what makes a topic 'sustainable' for 500 words versus one that runs out of ideas after 200.",
          "Have the student practise the selection process themselves on a new set of options, justifying their final choice.",
          "Model planning the chosen topic with a clear structure (for narrative: plot arc; for expository: paragraph topics).",
          "Guide the student through drafting, checking pacing at the midpoint to ensure they're not running out of content early.",
          "Review the completed draft for whether the chosen topic was sustained well across its full length.",
        ],
      },
      {
        title: "Paper 2 Comprehension: Multi-Text Literal and Inferential Reading",
        strand: "Reading and Viewing",
        description:
          "Practises the O-Level comprehension format across multiple texts (a visual text, a narrative/descriptive passage, a non-narrative passage) with literal and inferential questions. Train students to identify which text a question refers to quickly — a surprising number of marks are lost to simple misreading of the question.",
        conceptExplanation:
          "O-Level Paper 2 presents multiple related texts in different formats (often a visual text plus two written passages) precisely because reading across sources — recognising which text contains the answer to a given question, and sometimes synthesising information from more than one — is itself a tested skill, not just an added inconvenience. Students who don't explicitly check which text a question targets often waste time searching the wrong passage or, worse, answer from the wrong text entirely, which loses marks regardless of how well-reasoned the answer is. The underlying literal/inferential distinction from earlier levels still applies within each text, but is now layered on top of this text-identification step.",
        workedExamples: [
          {
            problem: "A question reads: 'According to the graph, which age group showed the greatest increase in smartphone usage?' Which text should be checked, and how do you know?",
            solution: [
              "Identify the specific data type requested — 'according to the graph' explicitly names the source text to consult.",
              "Locate the visual/graphical text among the text set (not the narrative or non-narrative written passages), since the question language directly points there.",
              "Read the graph specifically for age-group data and increase magnitude, rather than searching the written passages, which would waste time and likely not contain graph-specific data at all.",
            ],
          },
          {
            problem: "A question reads: 'Compare how Text A and Text B describe the impact of social media.' What's different about how this question must be answered?",
            solution: [
              "Recognise this explicitly requires information from BOTH texts, not just one — it's a synthesis question, not a single-text lookup.",
              "Locate the relevant information in Text A first and note it, then locate the corresponding information in Text B separately.",
              "Structure the answer to genuinely compare the two (similarities and/or differences), rather than just summarising each text's content side by side without an explicit comparison.",
            ],
          },
        ],
        teachingSteps: [
          "Preview all texts in the set (visual, narrative, non-narrative) before reading questions, noting each text's main topic.",
          "Model checking which specific text each question refers to before attempting to answer it.",
          "Answer one literal and one inferential question together per text, showing the evidence-quoting habit from earlier levels still applies.",
          "Have the student attempt the remaining questions independently, first labelling which text each question targets.",
          "Review answers, specifically checking for any mark lost purely from answering using the wrong text.",
        ],
      },
      {
        title: "Paper 3 Listening: Note-Taking and Key Information",
        strand: "Oracy",
        description:
          "Builds listening-comprehension technique — note-taking shorthand, catching key details on a single hearing, and answering while the recording continues. Practise with real timed audio, not just a transcript read aloud, since pacing is part of the actual difficulty.",
        conceptExplanation:
          "O-Level listening comprehension is genuinely harder than reading comprehension in one specific way: the audio plays at its own fixed pace, with no ability to pause or reread, so students must process and often begin answering WHILE still listening to what follows — this is why practising with a live tutor reading a transcript (which can be paced to the student) doesn't build the real skill the way genuine timed audio does. Shorthand note-taking (using abbreviations, symbols, and only key words rather than full sentences) exists because writing full sentences is too slow to keep pace with continuous spoken audio; the note-taker's job is to capture enough to reconstruct the answer afterward, not to transcribe everything heard.",
        workedExamples: [
          {
            problem: "Develop shorthand for taking notes on: 'The number of visitors to the museum increased significantly, from approximately 2,000 in January to over 5,500 by June.'",
            solution: [
              "Identify only the essential data points, not full sentences: the two numbers and the two time points.",
              "Convert to shorthand: 'visitors: Jan ~2000 → Jun 5500+ (big increase)'.",
              "Confirm the shorthand captures enough to reconstruct the full answer afterward (what increased, from what, to what, over what period) without having written a single complete sentence during listening.",
            ],
          },
          {
            problem: "A speaker says 'Now, this next point is particularly important for understanding the overall trend...' — what does this signal, and how should note-taking respond?",
            solution: [
              "Recognise this as an explicit verbal signal (a 'signpost phrase') that the upcoming information is especially important, not incidental detail.",
              "Prepare to prioritise capturing what follows this phrase carefully, even if it means abbreviating surrounding, less-signalled content more heavily.",
              "Confirm that training to notice these verbal signals (particularly, importantly, in contrast, however) helps allocate limited note-taking attention to the content most likely to be tested.",
            ],
          },
        ],
        teachingSteps: [
          "Introduce a simple shorthand system (abbreviations, symbols) for fast note-taking while listening.",
          "Play a short timed audio clip once, having the student practise jotting key details using the shorthand.",
          "Review what was captured versus missed, discussing which details were signalled by the speaker (e.g. 'importantly,' 'the key point is').",
          "Play a second, slightly longer clip, having the student answer questions while the recording continues rather than pausing it.",
          "Debrief on pacing specifically — was the student still writing when new information arrived, and how to keep up next time.",
        ],
      },
      {
        title: "Paper 4 Oral Communication: Reading Aloud and Planned Interaction",
        diagram: { type: "flow", steps: ["Reading Aloud", "Personal Response", "Discussion"] },
        strand: "Oracy",
        description:
          "Introduces the O-Level oral format: reading a passage aloud with clear pronunciation and expression, then a planned spoken interaction based on a stimulus. Record practice attempts — students are often unaware of filler words or flat delivery until they hear it back.",
        conceptExplanation:
          "The O-Level oral's planned spoken interaction differs from a rehearsed speech: students are given brief preparation time with a stimulus (often a picture or short prompt) and must develop a genuine, extended response and conversation around it, meaning the skill being assessed is thinking and elaborating in real time within a planned structure, not memorising a script. Filler words ('um,' 'like,' 'you know') and flat, monotone delivery are habits students are typically unaware of in their own speech because they don't interrupt the speaker's own sense of fluency the way they interrupt a listener's — this is precisely why recorded playback is more effective feedback than a tutor simply describing the issue verbally.",
        workedExamples: [
          {
            problem: "A recording reveals a student says 'um' or 'like' 15 times in a 2-minute response. Design a targeted fix.",
            solution: [
              "Identify the specific pattern from the recording — frequent filler words, rather than a vaguer 'needs to sound more confident' note.",
              "Practise a replacement strategy: pausing silently instead of filling the gap with 'um,' since a brief silence is far less distracting to a listener than a verbal filler.",
              "Re-record a short response on a new topic, counting filler word occurrences before and after, to make the improvement concrete and measurable rather than just a subjective impression.",
            ],
          },
          {
            problem: "Prepare for a stimulus about 'The Rise of Online Shopping' with 10 minutes of preparation time — plan (not script) the response.",
            solution: [
              "Read the stimulus material once fully to understand its content and any data provided.",
              "Jot 2-3 brief points to develop during the actual interaction, not full sentences: e.g. 'convenience vs. loss of physical retail jobs / personal experience example / view on the future trend'.",
              "Mentally rehearse elaborating on each point aloud once, checking each can be extended with a specific reason or example, without memorising exact wording — the goal is being ready to speak naturally FROM the points, not recite them.",
            ],
          },
        ],
        teachingSteps: [
          "Give the student a passage to mark up silently for pauses, stress and tricky words before reading aloud.",
          "Record the student reading it aloud, then play it back together to identify one specific delivery issue.",
          "Have the student re-read the same passage, focused only on fixing that one issue.",
          "Introduce the stimulus for the planned interaction and give preparation time to plan 2-3 points.",
          "Record the interaction, then review it together for filler words, pacing and how well the points were developed.",
        ],
      },
    ],
  },
  {
    level: "SEC4",
    topics: [
      {
        title: "Paper 1 Editing: Consolidating Common Error Patterns",
        strand: "Grammar in Context",
        description:
          "Consolidates editing accuracy against each student's own recurring error types from Sec 3 practice, under full exam time pressure. This is targeted revision — use a personal error log rather than reteaching grammar rules from scratch.",
        conceptExplanation:
          "By Sec4, the grammar content itself is not new — the remaining gap is almost always consistency under real exam pressure, where time constraints and cumulative fatigue cause previously-corrected error patterns to resurface. A personal error log, tracked across terms, reveals whether a specific error type is truly fixed (no longer appearing even under pressure) or was only ever suppressed during untimed practice — this distinction matters because exam-day performance is what counts, and untimed accuracy doesn't guarantee timed accuracy. Targeted revision means spending limited remaining practice time on the 1-2 error types with the worst track record, rather than spreading effort evenly across everything, since most error types are likely already reliable by this stage.",
        workedExamples: [
          {
            problem:
              "A student's error log shows preposition errors appearing in 2 of the last 3 timed passages, despite being explicitly retaught each time. What does this suggest, and what's the next step?",
            solution: [
              "Recognise that reteaching the rule hasn't been sufficient — the error persists specifically under timed conditions even after correction.",
              "Consider that this may be a fluency/automaticity issue rather than a knowledge gap — the student may know the rule but not apply it fast enough under pressure.",
              "Next step: increase the FREQUENCY of low-stakes, very short timed drills specifically on prepositions (e.g. 5 sentences, 90 seconds) rather than another full reteaching of the rule, to build faster automatic recognition.",
            ],
          },
          {
            problem: "Full timed passage, planted error: 'Each of the students were required to submit there assignment on time.'",
            solution: [
              "Systematic check pass 1 (agreement): 'Each of the students were' — 'Each' is singular, so the verb should be 'was', not 'were', despite the plural 'students' sitting closer.",
              "Systematic check pass 2 (spelling/word choice): 'there assignment' — 'there' is incorrect; the possessive 'their' is needed.",
              "Corrected: 'Each of the students was required to submit their assignment on time.'",
              "Confirm both errors were found because the systematic passes targeted them specifically, not because they were visually obvious on a casual read.",
            ],
          },
        ],
        teachingSteps: [
          "Review the student's personal error log from Sec3 and identify the 2 most persistent error types.",
          "Give a full timed editing passage under real exam conditions (no interruptions, strict time limit).",
          "Mark it together, checking specifically whether the two targeted error types were caught this time.",
          "If an error type is still being missed, do one focused mini-drill on that specific rule only.",
          "Repeat with a second timed passage a few days later to check whether the improvement held.",
        ],
      },
      {
        title: "Situational Writing: Exam-Format Mastery",
        strand: "Writing and Representing",
        description:
          "Full timed practice of situational writing across the range of practical text types and stimulus formats seen at O-Level, with a focus on consistently hitting task fulfilment, tone and the word-count band. Review past papers' mark schemes with students so they see exactly where marks are won and lost.",
        conceptExplanation:
          "Real O-Level mark schemes allocate specific mark bands to content, language and organisation, and reviewing them directly (rather than relying on general impressions of 'good writing') reveals exactly what separates a top-band from a mid-band response — often something concrete like 'response addresses all content points with elaboration' versus 'response addresses most content points with limited elaboration.' Consistency across repeated timed attempts matters more than one strong untimed piece, because the exam only rewards what a student can reliably reproduce under real time pressure — a mark scheme is a diagnostic tool for identifying a student's specific, recurring gap (content, tone, or length), not just a grading rubric.",
        workedExamples: [
          {
            problem:
              "A mark scheme states: 'Top band (13-15 marks): all content points covered with relevant elaboration; register and tone wholly appropriate.' A student's response covers all content points but with no elaboration, in a mostly appropriate tone. Estimate the likely band and explain why.",
            solution: [
              "Compare the response against the top band criteria point by point: content points covered — yes, matches; elaboration — missing, does not match; tone — 'mostly' appropriate, not 'wholly', a partial match.",
              "Since two of the three top-band criteria are only partially met, the response likely falls into a middle band rather than the top band, despite technically covering every required point.",
              "Identify the specific, actionable gap: elaboration is the clearest missing element, so future practice should specifically target expanding each content point with an example or explanation, not just naming it.",
            ],
          },
          {
            problem: "Across the last 3 timed situational writing attempts, a student's word counts were 210, 195, and 225 — all below the required 250-350 word band. Diagnose the likely cause and fix.",
            solution: [
              "Recognise this as a consistent pattern, not a one-off, meaning the cause is likely structural (e.g. insufficient elaboration per point, or too few points planned) rather than an isolated slip.",
              "Check whether the student's PLANNING stage lists enough content points with room for elaboration — if only 3 bare points are planned, 250+ words is difficult without padding.",
              "Fix: require the plan to include not just each content point but one supporting detail or example per point, which naturally extends length through genuine development rather than repetition.",
            ],
          },
        ],
        teachingSteps: [
          "Show a real past-paper mark scheme and discuss exactly how marks are allocated across content, language and organisation.",
          "Give a full timed situational writing task under exam conditions.",
          "Mark the student's response against the actual mark scheme criteria, not just a general impression.",
          "Identify the single biggest mark-losing pattern (missed content point, tone slip, or word count) across the last 2-3 attempts.",
          "Do one more timed practice targeting only that specific weakness, then re-mark against the same criteria.",
        ],
      },
      {
        title: "Continuous Writing: Language Craft Under Timed Conditions",
        strand: "Writing and Representing",
        description:
          "Sustains the plot/argument construction and language-craft work from Sec 3 but now entirely under exam timing, including planning, writing and a quick self-edit within the paper's time limit. Timing practice matters as much as content here — a strong unfinished essay still loses heavily.",
        conceptExplanation:
          "An unfinished composition is penalised heavily under O-Level marking regardless of the quality of what WAS written, because markers assess the piece as a whole against criteria like structure and resolution — a strong opening with no ending cannot demonstrate a complete plot arc or fully developed argument, capping the achievable mark regardless of individual sentence quality. This is why explicit time-budgeting (a fixed allocation for planning, writing, and self-editing, with checkpoints during writing) is a skill in its own right, separate from writing quality — a student can have excellent ideas and language ability but still underperform simply by mismanaging the clock, most commonly by over-investing in the opening and running out of time for the ending.",
        workedExamples: [
          {
            problem: "For a 55-minute continuous writing paper, propose a time budget with checkpoints.",
            solution: [
              "Allocate planning time first, since skipping this to 'save time' typically costs more time later through disorganised writing: approximately 5-7 minutes.",
              "Allocate the bulk of the time to writing, with an explicit midpoint checkpoint: by minute 30 (roughly halfway through writing time), the plot's climax or the argument's main body should be underway, not still in the setup phase.",
              "Reserve the final 3-5 minutes explicitly for self-editing rather than continuing to write new content, since a quick check of tense consistency and obvious errors can recover marks a rushed final draft would otherwise lose.",
            ],
          },
          {
            problem: "At the midpoint checkpoint, a student is still only in the story's setup phase with 20 minutes of writing time left. What should the student do?",
            solution: [
              "Recognise the pacing problem immediately rather than continuing at the same slow pace and running out of time entirely.",
              "Make a deliberate decision to compress the remaining planned content — moving through the middle events more quickly (fewer sentences per event) to reach the climax and resolution within the remaining time.",
              "Prioritise reaching a genuine ending over adding further detail to already-written sections, since an unfinished piece is penalised more heavily than a slightly less detailed but complete one.",
            ],
          },
        ],
        teachingSteps: [
          "Break down the full paper's time allocation together (planning, writing, self-edit) as a visible checkpoint schedule.",
          "Give a full timed continuous writing task, calling out time checkpoints as they pass.",
          "If the student is behind schedule at the midpoint checkpoint, coach them in the moment on cutting planned content, not writing faster carelessly.",
          "Review the finished (or unfinished) piece together, discussing specifically where time was lost.",
          "Repeat with a new topic, aiming to hit every checkpoint on schedule this time.",
        ],
      },
      {
        title: "Paper 2 Comprehension: Evaluative Questions and Summary Writing",
        strand: "Reading and Viewing",
        description:
          "Adds evaluative comprehension questions (judging effectiveness, inferring writer's purpose) and, where included, summary writing — condensing a passage's key points within a strict word limit. Summary writing rewards ruthless prioritisation of ideas; practise cutting a summary down word by word.",
        conceptExplanation:
          "Evaluative questions at O-Level go beyond earlier evaluative work by asking students to judge HOW WELL a writer achieved their purpose or how EFFECTIVE a particular technique or piece of evidence is, requiring both literary/rhetorical understanding and clear justification. Summary writing under a strict word limit is fundamentally an exercise in prioritisation, not compression of sentence structure — the skill is identifying which points are essential to the passage's core message and which are supporting detail or repetition that can be cut entirely, since simply shortening every sentence proportionally rarely reaches the required word count while keeping all key points intact.",
        workedExamples: [
          {
            problem: "Passage (summarised premise): five reasons are given for a company's success — strong leadership, innovative products, effective marketing, a supportive company culture, and lucky market timing, with the passage spending most of its length on leadership and products. Summarise the passage's key points in 40 words or fewer.",
            solution: [
              "List all five points first without worrying about length: leadership, products, marketing, culture, luck.",
              "Assess proportional emphasis in the original passage — leadership and products received the most development, suggesting they're the most central points.",
              "Draft an over-length summary covering all five, then cut ruthlessly — starting with the least emphasised or most redundant phrasing, not by shortening every sentence equally.",
              "Final 40-word version: 'The company succeeded due to strong leadership and innovative products, supported by effective marketing and a positive workplace culture, with some contribution from favourable market timing.' — all five points retained, no sentence individually maximally compressed but the whole kept tight.",
            ],
          },
          {
            problem: "Evaluate the effectiveness of this technique: an article about road safety opens with a statistic ('1 in 5 accidents involve a distracted driver') before any argument is made.",
            solution: [
              "Identify the technique: opening with a striking statistic before the main argument.",
              "Judge its effectiveness against the writer's likely purpose — the purpose is to persuade readers road safety matters, and a concrete, alarming statistic immediately establishes stakes and credibility before any opinion is stated.",
              "Justify the judgement specifically: this is effective because it grounds the argument in verifiable fact from the outset, making the reader more receptive to the persuasive content that follows, rather than the writer opening with an easily-dismissed opinion.",
            ],
          },
        ],
        teachingSteps: [
          "Answer one evaluative question together, modelling a judgement (on effectiveness or purpose) backed by specific textual evidence.",
          "Have the student attempt a second evaluative question independently, checking the judgement is justified, not just asserted.",
          "For summary writing, model identifying every key point in the passage before writing a single summary sentence.",
          "Draft an over-length summary together first, then model ruthlessly cutting it word by word to fit the limit while keeping every key point.",
          "Have the student summarise a new passage themselves, then cut their own over-length draft down to the word limit.",
        ],
      },
      {
        title: "Paper 3 Listening: Inference and Note Completion Practice",
        strand: "Oracy",
        description:
          "Moves listening practice beyond literal note-taking into inferential listening questions and note-completion formats under full exam conditions. Mixed-difficulty timed sets close to the exam date build the stamina the actual paper demands.",
        conceptExplanation:
          "Inferential listening questions require working out something NOT directly stated in the audio — often signalled through tone of voice, word choice, or implication rather than explicit statement, which is harder than inferential reading because there's no text to reread for the missed signal. Note-completion formats provide partial notes with gaps the student must fill while listening, which tests precise word-level listening (often a specific number, name, or short phrase) rather than general comprehension — predicting the TYPE of word likely to fill a gap (is it a number? a name? an action?) before listening helps the ear catch the right piece of information faster. Exam stamina matters because listening attention genuinely fatigues over a full paper's length, and mixed-difficulty practice sets closer to the exam build tolerance for sustaining focus that shorter, easier practice doesn't develop.",
        workedExamples: [
          {
            problem:
              "Audio: a speaker says, with a noticeably flat, unenthusiastic tone, 'Oh, I suppose the new office layout is... fine.' Question: 'How does the speaker really feel about the new layout?' Work out the inference.",
            solution: [
              "Note the literal words state a mildly positive judgement ('fine').",
              "Notice the described tone (flat, unenthusiastic) and the hesitation ('I suppose... fine') contradict genuine enthusiasm for something truly liked.",
              "Infer the speaker's real feeling is lukewarm or actually negative, despite the technically positive word choice — the tone and hesitation are the real signal, overriding the literal word.",
              "Confirm this demonstrates why literal transcription alone would miss the answer; the delivery itself carries the meaning here.",
            ],
          },
          {
            problem: "Note-completion gap: 'The conference will be held at the ___ Convention Centre.' Predict the type of missing word before listening.",
            solution: [
              "Analyse the sentence structure around the gap — it sits directly before 'Convention Centre,' a proper noun phrase.",
              "Predict the missing word is likely a proper noun — a specific place name (e.g. a city or building name) — not a number, verb, or common noun.",
              "Listen with this specific prediction active, which narrows attention to catching one specific name rather than processing the whole sentence generically.",
            ],
          },
        ],
        teachingSteps: [
          "Play a clip once and answer one literal note-taking question, then a second inferential question requiring reasoning beyond what was directly stated.",
          "Discuss what tone-of-voice or phrasing clues signalled the inference in the second question.",
          "Introduce a note-completion format, modelling how to predict the type of missing word (a number, a name, an action) before listening.",
          "Have the student complete a full mixed-difficulty timed set independently under exam conditions.",
          "Review results, focusing feedback on inferential items specifically since they're the newer, harder skill.",
        ],
      },
      {
        title: "Paper 4 Oral Communication: Stimulus-Based Discussion Mastery",
        strand: "Oracy",
        description:
          "Full mock oral exams — reading aloud plus an extended stimulus-based conversation — with structured feedback on content, language and delivery against the actual marking criteria. Do enough of these that the format itself stops being a source of nerves on the real day.",
        conceptExplanation:
          "O-Level oral marking criteria assess pronunciation, fluency, content and interaction as distinct, separately-scored dimensions — a student can score well on content (relevant, developed ideas) while losing marks on interaction specifically (not genuinely engaging with the examiner's follow-up questions, or giving only minimal responses). Repeated full-length mock exams under realistic conditions serve a purpose beyond content practice: familiarity with the exact format and time pressure reduces exam-day anxiety, which itself measurably affects performance — a student who has never experienced the full format under pressure tends to underperform relative to their actual ability on the real day, independent of preparation quality.",
        workedExamples: [
          {
            problem: "A mock oral scores well on content and language but low on 'interaction.' The transcript shows the student gives correct but very brief answers (1 sentence) to every follow-up question. Diagnose and fix.",
            solution: [
              "Identify the specific gap from the marking criteria — interaction specifically assesses genuine engagement and extended response to follow-up, not just correctness.",
              "Recognise the pattern: brief, correct answers technically respond but don't demonstrate the sustained interactive conversation the criteria reward.",
              "Fix: coach the student to treat every follow-up question as an invitation to elaborate with a reason or example, not just answer minimally — practise extending answers by one additional sentence every time, as a deliberate habit.",
            ],
          },
          {
            problem: "Compare two mock oral recordings from the same student, one week apart, both scoring similarly on content. What specific evidence would show genuine improvement versus no real change?",
            solution: [
              "Check pronunciation and fluency markers specifically — fewer filler words, steadier pace, clearer articulation would indicate genuine delivery improvement.",
              "Check interaction specifically — longer, more developed responses to follow-up questions, and genuine engagement (asking a clarifying question back, building naturally on the examiner's point) would indicate improvement there.",
              "If both mocks show the same brief-answer pattern and similar delivery, conclude no real change occurred despite the repeated practice, signalling the SAME specific area (not practice volume alone) needs more deliberate, targeted coaching before the actual exam.",
            ],
          },
        ],
        teachingSteps: [
          "Run a full mock oral under exam-like conditions: reading aloud, brief preparation time, then the stimulus conversation, all recorded.",
          "Score the recording against the actual marking criteria (pronunciation, fluency, content, interaction), not general impression.",
          "Identify the single area scoring lowest and do a focused 10-minute drill on just that area.",
          "Run a second full mock a few days later with a new stimulus, under the same timed conditions.",
          "Compare the two recordings together, having the student identify their own improvement to build exam-day confidence.",
        ],
      },
    ],
  },
];
