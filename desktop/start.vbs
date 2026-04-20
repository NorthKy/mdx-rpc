Dim shell, fso, scriptDir, nodeCmd

Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Get script directory
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)

' Check Node.js
If shell.Run("cmd /c where node >nul 2>&1", 0, True) <> 0 Then
MsgBox "Node.js is not installed or not in PATH!", 16, "Error"
WScript.Quit
End If

' Run Node (VISIBLE for debugging)
nodeCmd = "cmd /k node """ & scriptDir & "\index.js"""
shell.Run nodeCmd, 1, False

Set shell = Nothing
Set fso = Nothing


