Dim shell
Set shell = CreateObject("WScript.Shell")
shell.Run "cmd /c for /f ""tokens=5"" %a in ('netstat -aon ^| findstr :43215') do taskkill /f /pid %a", 0, True
shell.Run "cmd /c node """ & CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName) & "\index.js""", 0, False
Set shell = Nothing
