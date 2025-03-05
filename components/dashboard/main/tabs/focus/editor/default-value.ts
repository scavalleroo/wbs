export const defaultEditorContent = {
  content: [
    {
      content: [
        {
          text: "What are you up to?",
          type: "text"
        }
      ],
      attrs: {
        level: 4
      },
      type: "heading"
    },
    {
      content: [
        {
          attrs: {
            "checked": false
          },
          content: [
            {
              type: "paragraph"
            }
          ],
          type: "taskItem"
        }
      ],
      type: "taskList"
    }
  ],
  type: "doc"
};

export const firstLoginEditorContent = { "type": "doc", "content": [{ "type": "heading", "attrs": { "level": 1 }, "content": [{ "type": "text", "text": "Welcome to Weko! The AI powered workspace for " }, { "type": "text", "marks": [{ "type": "italic" }], "text": "digital wellebing" }, { "type": "text", "text": "." }] }, { "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "textStyle", "attrs": { "color": "#A8A29E" } }, { "type": "italic" }], "text": "(you can delete this text after reading)" }] }, { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "The 3 Main Sections" }] }, { "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "textStyle", "attrs": { "color": "#E00000" } }, { "type": "bold" }, { "type": "highlight", "attrs": { "color": "var(--novel-highlight-red)" } }], "text": "Focus" }, { "type": "text", "text": ": Set daily goals or capture ideas and notes. All notes sync to the cloud for access across your devices." }] }, { "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "bold" }, { "type": "highlight", "attrs": { "color": "var(--novel-highlight-blue)" } }], "text": "Break" }, { "type": "text", "text": ": Explore curated wellness activities to maintain your wellbeing. Coming soon: a virtual break room for socializing with colleagues and friends, similar to casual coffee machine conversations." }] }, { "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "textStyle", "attrs": { "color": "#FFA500" } }, { "type": "bold" }, { "type": "highlight", "attrs": { "color": "var(--novel-highlight-orange)" } }], "text": "Report" }, { "type": "text", "text": ": Weko automatically tracks your activity locally, providing insights into your time usage without manual input. Set personal targets for Focus, Break, and Idle time. Soon when you will meet your daily goals to earn rewards!" }] }, { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "Addition features" }] }, { "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "bold" }], "text": "Connect with Friends: " }, { "type": "text", "text": "Search and connect with friends on the app. Follow or unfollow users. Chat functionality coming soon." }] }, { "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "bold" }], "text": "Music" }, { "type": "text", "text": ": Spotify Premium users can play music directly through Weko. Choose tracks from our curated music library for your work sessions." }] }, { "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "bold" }], "text": "Timer" }, { "type": "text", "text": ": manual time tracking available." }] }, { "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "bold" }], "text": "Profile" }, { "type": "text", "text": ": Profile section coming soon with data preference management." }] }, { "type": "heading", "attrs": { "level": 3 }, "content": [{ "type": "text", "text": "Note from the team" }] }, { "type": "paragraph", "content": [{ "type": "text", "text": "This MVP version of Weko welcomes your feedback. We're grateful to have you join us early in this journey." }] }, { "type": "paragraph", "content": [{ "type": "text", "text": "" }] }, { "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "italic" }], "text": "Do it your way!" }] }] };