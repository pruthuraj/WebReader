Here is the properly arranged and cleaned version of your Markdown content:

````md
# WebReader Expo React Native + gluestack UI — Project Screen Plan

## 1. Project Goal

Build **WebReader** as an Expo React Native mobile app using **gluestack UI**.

The app should allow users to search, read, download, and listen to web novels. It should also support offline reading, reading progress tracking, local event tracking, and analytics sync.

The app should support:

- Novel search from web sources that will be scraped server-side (leave the it for last )
- Novel details page
- Chapter list
- Reader screen
- Offline chapter storage
- Download queue
- Text-to-Speech playback
- Reading progress tracking
- Event tracking and sync
- Clean mobile UI using gluestack components

---

## 2. Current Project Summary

The existing WebReader design describes a mobile app where users can search, read, download, and listen to web novels. It includes offline-first behavior using SQLite, device TTS, analytics events, and a FastAPI backend.

The original mobile app structure includes these screens:

- HomeScreen
- SearchResultsScreen
- NovelDetailsScreen
- ReaderScreen
- DownloadsScreen
- SettingsScreen
- DashboardScreen

The Expo version should keep the same product flow but replace React Native CLI-specific libraries with Expo-compatible packages.

---

## 3. Technology Migration

| Area             | Original                        | Expo Version     |
| ---------------- | ------------------------------- | ---------------- |
| App framework    | React Native CLI                | Expo             |
| UI library       | React Native components         | gluestack UI     |
| SQLite           | react-native-sqlite-storage     | expo-sqlite      |
| TTS              | react-native-tts                | expo-speech      |
| Network check    | @react-native-community/netinfo | expo-network     |
| Navigation       | React Navigation                | React Navigation |
| State management | Zustand                         | Zustand          |
| API client       | Axios                           | Axios            |

---

## 4. App Navigation Plan

Use a root stack navigator.

```txt
Root Stack
├── Home
├── SearchResults
├── NovelDetails
├── Reader
│   ├── ReaderSettings
│   └── TTSSettings
├── Downloads
├── Settings
└── Dashboard
```
````

The main reading flow should be:

```txt
HomeScreen
└── SearchResultsScreen
    └── NovelDetailsScreen
        └── ReaderScreen
            ├── ReaderSettings
            └── TTSSettings
```

Downloaded content flow:

```txt
DownloadsScreen
└── ReaderScreen
    ├── ReaderSettings
    └── TTSSettings
```

Settings and dashboard flow:

```txt
HomeScreen
├── SettingsScreen
└── DashboardScreen
```

---

# 5. Screen Descriptions

---

## 5.1 HomeScreen

The **HomeScreen** is the starting point of the WebReader app. Its main purpose is to give users a simple and friendly entry into the app.

From this screen, users should be able to:

- Search for novels
- Continue reading a previously opened novel
- Access downloaded content
- Open settings
- Open dashboard or admin area if enabled

The HomeScreen should feel clean and not overloaded. It should introduce the app with a clear title, a short description, and a search area. The search function should be the most visible element because finding novels is the main first action for most users.

The HomeScreen should also show useful quick-access sections such as:

- Continue Reading
- Recently Opened
- Popular Novels
- Downloaded Novels

These sections help returning users avoid searching again every time they open the app.

The HomeScreen should not contain too much detailed novel information. Its job is only to guide the user toward the next action. Detailed novel data should be shown later in the NovelDetailsScreen.

### Main responsibilities

| Responsibility   | Description                                        |
| ---------------- | -------------------------------------------------- |
| App entry point  | First screen the user sees                         |
| Search access    | Allows users to search for novels                  |
| Continue reading | Shows the user’s last reading progress             |
| Quick navigation | Gives access to downloads, settings, and dashboard |
| Recent content   | Shows recently opened or cached novels             |

### HomeScreen should not handle

- Full novel details
- Full chapter list
- Reader settings
- TTS settings
- Download processing logic
- Analytics dashboard details

---

## 5.2 SearchResultsScreen

The **SearchResultsScreen** displays the novels found after the user performs a search.

This screen should focus on helping the user compare search results and choose the correct novel.

Each search result should show only the most important information:

- Novel title
- Author, if available
- Source name
- Language
- Short description
- Tags or genres
- Availability status if useful

The user should be able to quickly understand what each novel is about without opening every item.

This screen can also include filters and sorting options. For example, users may want to filter by:

- Source
- Language
- Genre
- Recently updated novels
- Popular novels

Sorting can help organize results by:

- Relevance
- Popularity
- Recently updated
- Alphabetical order

The SearchResultsScreen is useful because the HomeScreen should stay simple. Instead of showing a large result list on the HomeScreen, the app can move users to a dedicated result page where they can browse comfortably.

When a user selects a novel from the search results, the app should navigate to the NovelDetailsScreen.

### Main responsibilities

| Responsibility         | Description                                                        |
| ---------------------- | ------------------------------------------------------------------ |
| Display search results | Shows novels matching the user’s query                             |
| Filtering              | Allows narrowing results by source, language, or genre             |
| Sorting                | Allows organizing results by relevance, popularity, or update date |
| Result selection       | Opens the selected novel in NovelDetailsScreen                     |
| Empty state            | Shows a helpful message when no results are found                  |

### SearchResultsScreen should not handle

- Chapter reading
- Download queue processing
- TTS playback
- Reader appearance settings
- Backend scraping logic directly

---

## 5.3 NovelDetailsScreen

The **NovelDetailsScreen** gives complete information about one selected novel.

This screen helps the user decide whether they want to read, download, or follow that novel.

It should show:

- Novel title
- Author
- Cover image if available
- Source name
- Language
- Tags or genres
- Description
- Chapter list
- Continue reading option if progress exists

The description should be readable and well-spaced. If the description is long, the screen can show a shorter preview with an option to expand it.

The most important part of this screen is the chapter list. Users should be able to see all available chapters in order. Each chapter should have clear actions such as:

- Read
- Download
- Mark as bookmarked, optional
- Show download status, optional

The screen should also support **Continue Reading** if the user has already started the novel. This allows the user to jump directly to the last opened chapter instead of scrolling through the chapter list again.

This screen should save novel and chapter metadata locally so that the app can show the same information later, even when offline.

### Main responsibilities

| Responsibility    | Description                                    |
| ----------------- | ---------------------------------------------- |
| Novel information | Shows full details about the selected novel    |
| Chapter list      | Displays all available chapters                |
| Continue reading  | Opens the last read chapter if progress exists |
| Download action   | Allows users to download one or more chapters  |
| Local caching     | Saves novel and chapter metadata locally       |
| Navigation        | Opens ReaderScreen when a chapter is selected  |

### NovelDetailsScreen should not handle

- Reading text layout
- TTS playback logic
- Dashboard analytics display
- Global app settings
- Direct scraping from websites

---

## 5.4 ReaderScreen

The **ReaderScreen** is the core screen of the app. This is where the user actually reads the selected chapter.

The design of this screen should be distraction-free. The text should be comfortable to read, with good spacing, readable font size, and enough padding on both sides. The screen should avoid unnecessary buttons or visual clutter while the user is reading.

The ReaderScreen should first check whether the chapter is already saved offline. If the chapter is available locally, it should open immediately from local storage. If it is not saved, the app should fetch the chapter from the backend and then store it locally for future use.

This screen should automatically save the user’s reading progress. For example, if the user leaves the chapter halfway through, the app should remember the position and allow the user to continue later.

The ReaderScreen should also provide access to reading controls and Text-to-Speech controls. However, these controls should be separated into child components so that the ReaderScreen stays clean and maintainable.

### ReaderScreen child components

```txt
ReaderScreen
├── ReaderSettings
└── TTSSettings
```

The ReaderScreen should manage the overall reading experience, but it should not contain all settings logic directly inside it.

### Main responsibilities

| Responsibility     | Description                                                |
| ------------------ | ---------------------------------------------------------- |
| Chapter display    | Shows the chapter title and chapter text                   |
| Progress saving    | Saves how far the user has scrolled                        |
| Offline loading    | Loads downloaded chapter text from local storage           |
| Online loading     | Fetches chapter text from backend if not available locally |
| Reader controls    | Opens ReaderSettings and TTSSettings                       |
| Chapter navigation | Allows moving to next or previous chapter                  |
| TTS connection     | Sends chapter text to the TTS controls/settings            |

### ReaderScreen should not handle directly

- All reader appearance settings logic
- All TTS configuration logic
- Search result filtering
- Download queue management
- Dashboard analytics

---

# 6. ReaderScreen Internal Structure

The ReaderScreen should be divided into smaller parts to keep the logic clean.

```txt
ReaderScreen
├── ChapterHeader
│   ├── Chapter title
│   └── Novel title
│
├── ReaderContent
│   └── Chapter text
│
├── ReaderProgress
│   └── Saved scroll position
│
├── ReaderSettings
│   ├── Font size
│   ├── Line height
│   ├── Theme
│   ├── Font style
│   ├── Screen blur
│   ├── Text alignment
│   ├── Screen brightness
│   ├── Margin / padding
│   └── Keep screen awake
│
├── TTSSettings
│   ├── Play
│   ├── Pause
│   ├── Resume
│   ├── Stop
│   ├── Speed
│   ├── Pitch
│   ├── Voice
│   ├── Language
│   ├── Auto-play next chapter
│   ├── Sleep timer
│   ├── Highlight current text
│   ├── Start from current position
│   └── Background playback
│
└── ChapterNavigation
    ├── Previous chapter
    └── Next chapter
```

---

## 6.1 ChapterHeader

The **ChapterHeader** shows basic information about the current reading context.

It should display:

- Novel title
- Chapter title
- Optional chapter number
- Optional back button

This component helps the user understand which novel and chapter they are currently reading.

---

## 6.2 ReaderContent

The **ReaderContent** displays the actual chapter text.

It should be clean, readable, and responsive to the user’s reading settings.

It should react to changes from ReaderSettings, such as:

- Font size
- Line height
- Theme
- Text alignment
- Margin or padding

ReaderContent should not contain settings controls itself. It should only display the text according to the selected settings.

---

## 6.3 ReaderProgress

The **ReaderProgress** tracks and restores the user’s reading position.

It should save how far the user has scrolled in the chapter. When the user returns to the same chapter later, the app should restore the previous position or offer a “Continue from last position” option.

ReaderProgress should help support the HomeScreen’s “Continue Reading” section.

---

## 6.4 ReaderSettings

The **ReaderSettings** component controls the visual reading experience.

It should allow the user to change how the text looks while reading.

ReaderSettings exists because every user has different reading preferences. Some users prefer larger text, some prefer dark mode, and some prefer more spacing between lines.

This component should only focus on reading appearance, not audio settings.

### ReaderSettings should include

| Setting           | Description                                                        |
| ----------------- | ------------------------------------------------------------------ |
| Font size         | Increase or decrease chapter text size                             |
| Line height       | Adjust spacing between lines                                       |
| Font style        | Choose default, serif, or sans-serif font                          |
| Theme             | Change the reader theme, such as light, dark, or sepia             |
| Screen blur       | Adjust blur or visual softness of the reading background if needed |
| Text alignment    | Choose left-aligned or justified text                              |
| Screen brightness | Optional reader brightness control                                 |
| Margin / padding  | Adjust text width and spacing                                      |
| Keep screen awake | Prevent the screen from sleeping while reading                     |

### Example behavior

When the user changes font size, the chapter text should update immediately.

When the user switches to dark mode, the reader background and text color should change immediately.

When the user changes line height, the reading text should become more or less spaced.

### ReaderSettings should not control

- TTS speed
- TTS pitch
- TTS voice
- Download queue
- Search results
- Analytics dashboard

Its job is only to control the reading display.

---

## 6.5 TTSSettings

The **TTSSettings** component controls the listening experience.

It should allow the user to customize how the chapter is read aloud.

TTSSettings exists because listening preferences are different from reading preferences. A user may want large text but slow audio, or small text but fast audio.

This component should only focus on Text-to-Speech behavior.

### TTSSettings should include

| Setting                      | Description                                             |
| ---------------------------- | ------------------------------------------------------- |
| Play / Pause / Resume / Stop | Basic TTS controls                                      |
| Speech speed                 | Adjust how fast the text is spoken                      |
| Pitch                        | Adjust voice pitch                                      |
| Voice selection              | Choose available system voice                           |
| Language                     | Select TTS language                                     |
| Auto-play next chapter       | Automatically continue when chapter ends                |
| Sleep timer                  | Stop reading after selected time                        |
| Highlight current text       | Optional feature to highlight currently spoken sentence |
| Start from current position  | TTS should start from where the user is reading         |
| Background playback          | Optional advanced feature                               |

### Example behavior

When the user taps Play, the app should start reading the current chapter aloud.

When the user changes speed, the new speed should apply to future playback.

When the user enables auto-play next chapter, the app should automatically move to the next chapter after the current one finishes.

### TTSSettings should not control

- Font size
- Reader theme
- Novel search
- Downloads
- Dashboard analytics

Its job is only to control audio and listening behavior.

---

## 6.6 ChapterNavigation

The **ChapterNavigation** component allows users to move between chapters.

It should include:

- Previous chapter
- Next chapter
- Optional chapter list shortcut
- Optional auto-open next chapter after finishing current chapter

This component should be simple and should not interrupt the reading experience.

---

# 7. DownloadsScreen

The **DownloadsScreen** manages offline reading content.

Its purpose is to show which chapters have been downloaded, which are waiting in the queue, which are currently downloading, and which failed.

This screen is important for users who want to read without internet. It should clearly show download status using simple labels such as:

- Queued
- Downloading
- Downloaded
- Failed

Users should be able to open downloaded chapters directly from this screen. If a download failed, the user should be able to retry it. If a user no longer needs a chapter, the screen can provide an option to delete it from local storage.

The DownloadsScreen should work even when the device is offline because it mainly reads data from the local database. When the device comes back online, queued or failed downloads can be retried.

This screen should be simple and practical. It is not meant for discovering new novels; it is only for managing offline content.

### Main responsibilities

| Responsibility         | Description                                                |
| ---------------------- | ---------------------------------------------------------- |
| Download list          | Shows queued, downloading, downloaded, and failed chapters |
| Offline access         | Allows users to open downloaded chapters                   |
| Retry failed downloads | Allows failed downloads to be retried                      |
| Delete downloads       | Allows users to remove downloaded chapters                 |
| Download status        | Shows clear status for each chapter                        |

### DownloadsScreen should not handle

- Novel search
- Reader visual settings
- TTS configuration
- Analytics dashboard display

---

# 8. SettingsScreen

The **SettingsScreen** allows users to personalize the reading and listening experience.

The main settings should include:

- Reader font size
- Reader theme
- Text-to-Speech speed
- Text-to-Speech pitch
- Language preference
- Download behavior
- Sync behavior

These settings directly affect how users experience the ReaderScreen.

The screen can also include download-related settings, such as:

- Download only on Wi-Fi
- Retry failed downloads automatically
- Clear downloaded chapters
- Clear failed download queue

For development or internal testing, this screen can include developer options such as:

- Backend URL
- Sync now
- Clear local database
- Show pending event count

These options should be hidden or separated from normal user settings in a production version.

The SettingsScreen should be available offline because settings are local to the device. Changes made here should immediately affect other screens, especially ReaderScreen and TTSSettings.

### Main responsibilities

| Responsibility       | Description                                  |
| -------------------- | -------------------------------------------- |
| Reader preferences   | Controls reading appearance defaults         |
| TTS preferences      | Controls listening defaults                  |
| Download preferences | Controls download behavior                   |
| Sync preferences     | Controls event sync behavior                 |
| Developer options    | Provides testing controls during development |

### SettingsScreen should not handle

- Reading chapter text directly
- Searching novels
- Showing detailed analytics
- Scraping website content

---

# 9. DashboardScreen

The **DashboardScreen** is an optional internal analytics screen.

It is mainly useful for admins, analysts, or developers who want to understand how the app is being used.

This screen should show high-level metrics such as:

- Total searches
- Total novel opens
- Chapters read
- Text-to-Speech usage
- Average reading time
- Popular novels
- Drop-off by chapter

It can also show engagement information, such as which chapters users open most often or where users stop reading. This helps the app operator understand reading behavior and improve the product.

Unlike most other screens, the DashboardScreen is mostly online-dependent because it needs analytics data from the backend. If the user is offline, the screen should show a clear message saying that analytics are not available.

This screen should not be shown as a main feature for normal readers unless needed. It is better placed behind an internal admin area or developer setting.

### Main responsibilities

| Responsibility      | Description                                       |
| ------------------- | ------------------------------------------------- |
| Usage metrics       | Shows total searches, opens, reads, and TTS usage |
| Popular novels      | Shows which novels are most opened                |
| Engagement data     | Shows reading behavior and usage trends           |
| Drop-off analysis   | Shows where readers stop reading                  |
| Internal monitoring | Helps developers or admins understand app usage   |

### DashboardScreen should not handle

- Normal reader settings
- Chapter reading
- TTS playback
- Novel download processing
- Search result browsing

---

# 10. Clean Responsibility Split

| Component / Screen  | Main Job                                                          |
| ------------------- | ----------------------------------------------------------------- |
| HomeScreen          | Starting point for search, continue reading, and quick navigation |
| SearchResultsScreen | Shows full search results with filters and sorting                |
| NovelDetailsScreen  | Shows novel information and chapter list                          |
| ReaderScreen        | Main container for reading a chapter                              |
| ChapterHeader       | Shows current novel and chapter title                             |
| ReaderContent       | Displays the chapter text                                         |
| ReaderProgress      | Saves and restores reading position                               |
| ReaderSettings      | Controls reading appearance                                       |
| TTSSettings         | Controls listening and audio behavior                             |
| ChapterNavigation   | Moves between chapters                                            |
| DownloadsScreen     | Manages downloaded chapters and offline reading                   |
| SettingsScreen      | Controls global app preferences                                   |
| DashboardScreen     | Shows internal analytics and usage metrics                        |

---

# 11. Final Screen Summary

| Screen              | Main Purpose                                                                                   |
| ------------------- | ---------------------------------------------------------------------------------------------- |
| HomeScreen          | Starting point for search, continue reading, recent novels, downloads, settings, and dashboard |
| SearchResultsScreen | Shows search results with filters and sorting options                                          |
| NovelDetailsScreen  | Shows full novel information and chapter list                                                  |
| ReaderScreen        | Displays chapter text, saves progress, and connects to reader/TTS controls                     |
| ReaderSettings      | Controls font size, theme, line height, layout, and other reading appearance settings          |
| TTSSettings         | Controls play, pause, resume, stop, speed, pitch, voice, language, and auto-play behavior      |
| DownloadsScreen     | Manages offline chapters, download status, retry, and delete actions                           |
| SettingsScreen      | Manages app-wide reading, TTS, download, sync, and developer settings                          |
| DashboardScreen     | Shows internal analytics and usage metrics                                                     |
