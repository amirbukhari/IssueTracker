# issuetracker README

VSCode extension for quickly getting to gitlab issues from within VSCode

## Features



## Requirements



## Extension Settings
In settings.json provide the link to your project
```json
  "issueTracker.gitLabProjectURL": "https://gitlab.com/???/???/???"
```
Specify which files to ignore. It's important to ignore folders such as "./.git" to reduce compute time and only show you issues relevant to your project.
 ```json
    "issueTracker.foldersToIgnore":[
        "./.git",
        "./coverage",
        "./node_modules",
        "./src/downloads",
        "./src/uploads",
    ]
```

Specify which files type to search for issue numbers in. 
 ```json
    "issueTracker.fileTypes":[
        ".ts",
    ]
```




