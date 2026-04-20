Dim shell, fso, scriptDir, port, nodePath, cmd

Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
port = 43215

shell.Run "cmd /c taskkill /F /IM node.exe", 0, True

If shell.Run("cmd /c where node >nul 2>&1", 0, True) <> 0 Then
MsgBox "Node.js not found in PATH", 16, "Error"
WScript.Quit
End If

cmd = "cmd /c node """ & scriptDir & "\index.js"""
shell.Run cmd, 0, false

Set shell = Nothing
Set fso = Nothing





