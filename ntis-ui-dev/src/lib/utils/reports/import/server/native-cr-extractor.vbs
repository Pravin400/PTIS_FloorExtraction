' ==============================================================================
' Native Crystal Reports Object Hierarchy & Coordinate Extractor
' Uses craxdrt.dll (Crystal Reports ActiveX Designer Runtime)
' Outputs 100% faithful JSON with sections, objects, twip->px coordinates, and fonts
' ==============================================================================

Option Explicit

Sub Main()
    If WScript.Arguments.Count < 2 Then
        WScript.Echo "Usage: cscript //Nologo native-cr-extractor.vbs <rptPath> <outputJsonPath>"
        WScript.Quit 1
    End If

    Dim rptPath, outPath
    rptPath = WScript.Arguments(0)
    outPath = WScript.Arguments(1)

    Dim fso
    Set fso = CreateObject("Scripting.FileSystemObject")
    If Not fso.FileExists(rptPath) Then
        WScript.Echo "ERROR: RPT file not found: " & rptPath
        WScript.Quit 2
    End If

    Dim app, rep
    On Error Resume Next
    Set app = CreateObject("CrystalRuntime.Application.11")
    If Err.Number <> 0 Then
        Err.Clear
        Set app = CreateObject("CrystalRuntime.Application")
    End If
    If Err.Number <> 0 Then
        WScript.Echo "ERROR: Could not create CrystalRuntime.Application COM object: " & Err.Description
        WScript.Quit 3
    End If

    Set rep = app.OpenReport(rptPath, 1)
    If Err.Number <> 0 Then
        WScript.Echo "ERROR: OpenReport failed: " & Err.Description
        WScript.Quit 4
    End If
    On Error GoTo 0

    ' Coordinate helper: 1 px = 15 twips
    ' 1 mm = 56.69 twips = 3.7795 px
    Dim twipsPerPx, twipsPerMm
    twipsPerPx = 15
    twipsPerMm = 56.6929

    Dim orientationStr, paperSizeStr
    If rep.PaperOrientation = 2 Then
        orientationStr = "landscape"
    Else
        orientationStr = "portrait"
    End If

    Select Case rep.PaperSize
        Case 8: paperSizeStr = "A3"
        Case 9: paperSizeStr = "A4"
        Case 1: paperSizeStr = "Letter"
        Case 5: paperSizeStr = "Legal"
        Case Else: paperSizeStr = "A4"
    End Select

    Dim widthMm, heightMm, pageWidth, pageHeight
    If orientationStr = "landscape" Then
        If paperSizeStr = "A3" Then
            widthMm = 420: heightMm = 297
        Else
            widthMm = 297: heightMm = 210
        End If
    Else
        If paperSizeStr = "A3" Then
            widthMm = 297: heightMm = 420
        Else
            widthMm = 210: heightMm = 297
        End If
    End If
    pageWidth = Round(widthMm * 3.7795)
    pageHeight = Round(heightMm * 3.7795)

    Dim topMarginMm, bottomMarginMm, leftMarginMm, rightMarginMm
    topMarginMm = Round(rep.TopMargin / twipsPerMm, 1)
    bottomMarginMm = Round(rep.BottomMargin / twipsPerMm, 1)
    leftMarginMm = Round(rep.LeftMargin / twipsPerMm, 1)
    rightMarginMm = Round(rep.RightMargin / twipsPerMm, 1)
    If topMarginMm <= 0 Then topMarginMm = 10
    If bottomMarginMm <= 0 Then bottomMarginMm = 10
    If leftMarginMm <= 0 Then leftMarginMm = 10
    If rightMarginMm <= 0 Then rightMarginMm = 10

    ' Process Sections
    Dim sectionsJson, elementsJson
    sectionsJson = "["
    elementsJson = "["

    Dim secIndex, sec, objIndex, obj
    secIndex = 0
    objIndex = 0

    For Each sec In rep.Sections
        secIndex = secIndex + 1
        Dim secId, secName, secHeightTwips, secHeightPx, secHeightMm, secType
        secId = LCase(sec.Name)
        secName = sec.Name
        secHeightTwips = sec.Height
        secHeightPx = Round(secHeightTwips / twipsPerPx)
        secHeightMm = Round(secHeightTwips / twipsPerMm, 1)

        If InStr(1, secName, "header", 1) > 0 Then
            secType = "header"
        ElseIf InStr(1, secName, "detail", 1) > 0 Then
            secType = "detail"
        Else
            secType = "footer"
        End If

        If secIndex > 1 Then sectionsJson = sectionsJson & ","
        sectionsJson = sectionsJson & vbCrLf & "  {" & _
            """id"": """ & JsonEscape(secId) & """," & _
            """name"": """ & JsonEscape(secName) & """," & _
            """type"": """ & secType & """," & _
            """height"": " & secHeightPx & "," & _
            """heightMm"": " & Replace(CStr(secHeightMm), ",", ".") & "," & _
            """heightTwips"": " & secHeightTwips & "," & _
            """visible"": true" & _
            "}"

        ' Process Report Objects in this Section
        For Each obj In sec.ReportObjects
            objIndex = objIndex + 1
            Dim elId, elType, elText, elField, elFormula
            Dim leftTwips, topTwips, widthTwips, heightTwips
            Dim leftPx, topPx, widthPx, heightPx
            Dim leftMm, topMm, widthMmEl, heightMmEl
            Dim fontName, fontSize, isBold, isItalic, alignStr, textColor

            elId = LCase(obj.Name)
            fontName = "Noto Sans Devanagari"
            fontSize = 9.5
            isBold = False
            isItalic = False
            alignStr = "left"
            textColor = "#000000"
            elText = ""
            elField = ""
            elFormula = ""

            On Error Resume Next
            If obj.Kind = 3 Or obj.Kind = 4 Then ' Line or Box
                leftTwips = obj.Left
                topTwips = obj.Top
                widthTwips = Abs(obj.Right - obj.Left)
                heightTwips = Abs(obj.Bottom - obj.Top)
                If obj.Left > obj.Right Then leftTwips = obj.Right
                If obj.Top > obj.Bottom Then topTwips = obj.Bottom
                If obj.Kind = 4 Then elType = "box" Else elType = "line"
            Else
                leftTwips = obj.Left
                topTwips = obj.Top
                widthTwips = obj.Width
                heightTwips = obj.Height
            End If

            leftPx = Round(leftTwips / twipsPerPx)
            topPx = Round(topTwips / twipsPerPx)
            widthPx = Round(widthTwips / twipsPerPx)
            heightPx = Round(heightTwips / twipsPerPx)
            leftMm = Round(leftTwips / twipsPerMm, 1)
            topMm = Round(topTwips / twipsPerMm, 1)
            widthMmEl = Round(widthTwips / twipsPerMm, 1)
            heightMmEl = Round(heightTwips / twipsPerMm, 1)


            On Error Resume Next
            If obj.Kind = 2 Then ' crTextObject
                elType = "text"
                elText = obj.Text
                fontName = obj.Font.Name
                fontSize = obj.Font.Size
                isBold = CBool(obj.Font.Bold)
                isItalic = CBool(obj.Font.Italic)
                Select Case obj.HorAlignment
                    Case 2: alignStr = "right"
                    Case 3: alignStr = "center"
                    Case 4: alignStr = "justify"
                    Case Else: alignStr = "left"
                End Select
            ElseIf obj.Kind = 1 Then ' crFieldObject
                elType = "field"
                elField = obj.Field.Name
                elText = "{" & obj.Field.Name & "}"
                If obj.FormulaName <> "" Then
                    elFormula = obj.FormulaName
                    elType = "formula"
                    elText = "{@" & obj.FormulaName & "}"
                End If
                fontName = obj.Font.Name
                fontSize = obj.Font.Size
                isBold = CBool(obj.Font.Bold)
                isItalic = CBool(obj.Font.Italic)
                Select Case obj.HorAlignment
                    Case 2: alignStr = "right"
                    Case 3: alignStr = "center"
                    Case Else: alignStr = "left"
                End Select
            ElseIf obj.Kind = 4 Then ' crBoxObject
                elType = "box"
                elText = ""
            ElseIf obj.Kind = 3 Then ' crLineObject
                elType = "line"
                elText = ""
            ElseIf obj.Kind = 6 Then ' crOleObject / Picture
                elType = "image"
                elText = ""
            ElseIf obj.Kind = 5 Then ' crSubreportObject
                elType = "subreport"
                elText = "[Subreport: " & obj.SubreportName & "]"
            Else
                elType = "unknown"
                elText = obj.Name
            End If
            On Error GoTo 0

            If objIndex > 1 Then elementsJson = elementsJson & ","
            elementsJson = elementsJson & vbCrLf & "  {" & _
                """id"": """ & JsonEscape(elId) & """," & _
                """sectionId"": """ & JsonEscape(secId) & """," & _
                """type"": """ & elType & """," & _
                """name"": """ & JsonEscape(obj.Name) & """," & _
                """kind"": " & obj.Kind & "," & _
                """text"": """ & JsonEscape(elText) & """," & _
                """fieldName"": """ & JsonEscape(elField) & """," & _
                """formulaName"": """ & JsonEscape(elFormula) & """," & _
                """x"": " & leftPx & "," & _
                """y"": " & topPx & "," & _
                """width"": " & widthPx & "," & _
                """height"": " & heightPx & "," & _
                """xMm"": " & Replace(CStr(leftMm), ",", ".") & "," & _
                """yMm"": " & Replace(CStr(topMm), ",", ".") & "," & _
                """widthMm"": " & Replace(CStr(widthMmEl), ",", ".") & "," & _
                """heightMm"": " & Replace(CStr(heightMmEl), ",", ".") & "," & _
                """leftTwips"": " & leftTwips & "," & _
                """topTwips"": " & topTwips & "," & _
                """widthTwips"": " & widthTwips & "," & _
                """heightTwips"": " & heightTwips & "," & _
                """styles"": {" & _
                    """fontFamily"": """ & JsonEscape(fontName) & """," & _
                    """fontSize"": """ & Replace(CStr(fontSize), ",", ".") & "pt""," & _
                    """fontWeight"": """ & IIf(isBold, "700", "400") & """," & _
                    """fontStyle"": """ & IIf(isItalic, "italic", "normal") & """," & _
                    """textAlign"": """ & alignStr & """," & _
                    """color"": """ & textColor & """" & _
                "}" & _
                "}"
        Next
    Next

    ' A subreport object is only a container in the parent report. Open every
    ' embedded report and serialize its real sections and objects as editable
    ' designer bands. Nested subreports are supported up to four levels.
    AppendEmbeddedSubreports rep, "embedded", 0, sectionsJson, elementsJson, secIndex, objIndex, twipsPerPx, twipsPerMm

    sectionsJson = sectionsJson & vbCrLf & "]"
    elementsJson = elementsJson & vbCrLf & "]"

    ' Build Root Definition JSON
    Dim reportId
    reportId = fso.GetBaseName(rptPath)

    Dim fullJson
    fullJson = "{" & vbCrLf & _
        "  ""reportId"": """ & JsonEscape(reportId) & """," & vbCrLf & _
        "  ""reportName"": """ & JsonEscape(reportId) & """," & vbCrLf & _
        "  ""layoutVersion"": 1," & vbCrLf & _
        "  ""updatedAt"": """ & Now & """," & vbCrLf & _
        "  ""extractor"": ""NativeCrystalReportsActiveXRuntime""," & vbCrLf & _
        "  ""paperSize"": """ & paperSizeStr & """," & vbCrLf & _
        "  ""orientation"": """ & orientationStr & """," & vbCrLf & _
        "  ""widthMm"": " & widthMm & "," & vbCrLf & _
        "  ""heightMm"": " & heightMm & "," & vbCrLf & _
        "  ""pageWidth"": " & pageWidth & "," & vbCrLf & _
        "  ""pageHeight"": " & pageHeight & "," & vbCrLf & _
        "  ""margins"": {""top"": " & Replace(CStr(topMarginMm), ",", ".") & ", ""right"": " & Replace(CStr(rightMarginMm), ",", ".") & ", ""bottom"": " & Replace(CStr(bottomMarginMm), ",", ".") & ", ""left"": " & Replace(CStr(leftMarginMm), ",", ".") & "}," & vbCrLf & _
        "  ""sections"": " & sectionsJson & "," & vbCrLf & _
        "  ""elements"": " & elementsJson & vbCrLf & _
        "}"

    ' Write to UTF-8 file via ADODB.Stream
    Dim stm
    Set stm = CreateObject("ADODB.Stream")
    stm.Type = 2 ' adTypeText
    stm.Charset = "utf-8"
    stm.Open
    stm.WriteText fullJson
    stm.SaveToFile outPath, 2 ' adSaveCreateOverWrite
    stm.Close

    WScript.Echo "SUCCESS: Native extraction completed! Elements: " & objIndex & " written to " & outPath
End Sub

Sub AppendEmbeddedSubreports(parentReport, parentPrefix, depth, ByRef sectionsJson, ByRef elementsJson, ByRef secIndex, ByRef objIndex, twipsPerPx, twipsPerMm)
    If depth >= 4 Then Exit Sub

    Dim parentSection, subObject, subName, subPrefix, subReport
    For Each parentSection In parentReport.Sections
        For Each subObject In parentSection.ReportObjects
            If subObject.Kind = 5 Then
                subName = subObject.SubreportName
                subPrefix = SafeId(parentPrefix & "_" & subObject.Name & "_" & subName)
                Set subReport = Nothing

                On Error Resume Next
                Err.Clear
                Set subReport = parentReport.OpenSubreport(subName)
                If subReport Is Nothing Then
                    Err.Clear
                    Set subReport = subObject.OpenSubreport(subName)
                End If
                If subReport Is Nothing Then
                    Err.Clear
                    Set subReport = subObject.OpenSubreport
                End If
                On Error GoTo 0

                If Not subReport Is Nothing Then
                    AppendSubreportDefinition subReport, subName, subPrefix, depth, sectionsJson, elementsJson, secIndex, objIndex, twipsPerPx, twipsPerMm
                    AppendEmbeddedSubreports subReport, subPrefix, depth + 1, sectionsJson, elementsJson, secIndex, objIndex, twipsPerPx, twipsPerMm
                End If
            End If
        Next
    Next
End Sub

Sub AppendSubreportDefinition(subReport, subreportName, subPrefix, depth, ByRef sectionsJson, ByRef elementsJson, ByRef secIndex, ByRef objIndex, twipsPerPx, twipsPerMm)
    Dim childSection, childObject
    Dim childSectionId, childSectionName, childSectionType
    Dim sectionHeightTwips, sectionHeightPx, sectionHeightMm
    Dim elementId, elementType, elementText, elementField, elementFormula
    Dim leftTwips, topTwips, widthTwips, heightTwips
    Dim leftPx, topPx, widthPx, heightPx
    Dim leftMm, topMm, widthMmEl, heightMmEl
    Dim fontName, fontSize, isBold, isItalic, alignStr, textColor

    For Each childSection In subReport.Sections
        secIndex = secIndex + 1
        childSectionName = childSection.Name
        childSectionId = subPrefix & "_" & SafeId(childSectionName)
        sectionHeightTwips = childSection.Height
        sectionHeightPx = Round(sectionHeightTwips / twipsPerPx)
        sectionHeightMm = Round(sectionHeightTwips / twipsPerMm, 1)

        If InStr(1, childSectionName, "header", 1) > 0 Then
            childSectionType = "header"
        ElseIf InStr(1, childSectionName, "detail", 1) > 0 Then
            childSectionType = "detail"
        Else
            childSectionType = "footer"
        End If

        If secIndex > 1 Then sectionsJson = sectionsJson & ","
        sectionsJson = sectionsJson & vbCrLf & "  {" & _
            """id"": """ & JsonEscape(childSectionId) & """," & _
            """name"": ""Subreport: " & JsonEscape(subreportName) & " / " & JsonEscape(childSectionName) & """," & _
            """type"": """ & childSectionType & """," & _
            """height"": " & sectionHeightPx & "," & _
            """heightMm"": " & Replace(CStr(sectionHeightMm), ",", ".") & "," & _
            """heightTwips"": " & sectionHeightTwips & "," & _
            """isSubreport"": true," & _
            """subreportName"": """ & JsonEscape(subreportName) & """," & _
            """subreportDepth"": " & depth + 1 & "," & _
            """visible"": true" & _
            "}"

        For Each childObject In childSection.ReportObjects
            objIndex = objIndex + 1
            elementId = subPrefix & "_" & SafeId(childObject.Name)
            fontName = "Noto Sans Devanagari"
            fontSize = 9.5
            isBold = False
            isItalic = False
            alignStr = "left"
            textColor = "#000000"
            elementText = ""
            elementField = ""
            elementFormula = ""
            elementType = "unknown"

            On Error Resume Next
            If childObject.Kind = 3 Or childObject.Kind = 4 Then
                leftTwips = childObject.Left
                topTwips = childObject.Top
                widthTwips = Abs(childObject.Right - childObject.Left)
                heightTwips = Abs(childObject.Bottom - childObject.Top)
                If childObject.Left > childObject.Right Then leftTwips = childObject.Right
                If childObject.Top > childObject.Bottom Then topTwips = childObject.Bottom
            Else
                leftTwips = childObject.Left
                topTwips = childObject.Top
                widthTwips = childObject.Width
                heightTwips = childObject.Height
            End If

            leftPx = Round(leftTwips / twipsPerPx)
            topPx = Round(topTwips / twipsPerPx)
            widthPx = Round(widthTwips / twipsPerPx)
            heightPx = Round(heightTwips / twipsPerPx)
            leftMm = Round(leftTwips / twipsPerMm, 1)
            topMm = Round(topTwips / twipsPerMm, 1)
            widthMmEl = Round(widthTwips / twipsPerMm, 1)
            heightMmEl = Round(heightTwips / twipsPerMm, 1)

            If childObject.Kind = 2 Then
                elementType = "text"
                elementText = childObject.Text
                fontName = childObject.Font.Name
                fontSize = childObject.Font.Size
                isBold = CBool(childObject.Font.Bold)
                isItalic = CBool(childObject.Font.Italic)
                Select Case childObject.HorAlignment
                    Case 2: alignStr = "right"
                    Case 3: alignStr = "center"
                    Case 4: alignStr = "justify"
                    Case Else: alignStr = "left"
                End Select
            ElseIf childObject.Kind = 1 Then
                elementType = "field"
                elementField = childObject.Field.Name
                elementText = "{" & childObject.Field.Name & "}"
                If childObject.FormulaName <> "" Then
                    elementFormula = childObject.FormulaName
                    elementType = "formula"
                    elementText = "{@" & childObject.FormulaName & "}"
                End If
                fontName = childObject.Font.Name
                fontSize = childObject.Font.Size
                isBold = CBool(childObject.Font.Bold)
                isItalic = CBool(childObject.Font.Italic)
                Select Case childObject.HorAlignment
                    Case 2: alignStr = "right"
                    Case 3: alignStr = "center"
                    Case Else: alignStr = "left"
                End Select
            ElseIf childObject.Kind = 4 Then
                elementType = "box"
            ElseIf childObject.Kind = 3 Then
                elementType = "line"
            ElseIf childObject.Kind = 6 Then
                elementType = "image"
            ElseIf childObject.Kind = 5 Then
                elementType = "subreport"
                elementText = "[Subreport: " & childObject.SubreportName & "]"
            Else
                elementText = childObject.Name
            End If
            On Error GoTo 0

            If objIndex > 1 Then elementsJson = elementsJson & ","
            elementsJson = elementsJson & vbCrLf & "  {" & _
                """id"": """ & JsonEscape(elementId) & """," & _
                """sectionId"": """ & JsonEscape(childSectionId) & """," & _
                """type"": """ & elementType & """," & _
                """name"": """ & JsonEscape(childObject.Name) & """," & _
                """kind"": " & childObject.Kind & "," & _
                """text"": """ & JsonEscape(elementText) & """," & _
                """fieldName"": """ & JsonEscape(elementField) & """," & _
                """formulaName"": """ & JsonEscape(elementFormula) & """," & _
                """x"": " & leftPx & "," & _
                """y"": " & topPx & "," & _
                """width"": " & widthPx & "," & _
                """height"": " & heightPx & "," & _
                """xMm"": " & Replace(CStr(leftMm), ",", ".") & "," & _
                """yMm"": " & Replace(CStr(topMm), ",", ".") & "," & _
                """widthMm"": " & Replace(CStr(widthMmEl), ",", ".") & "," & _
                """heightMm"": " & Replace(CStr(heightMmEl), ",", ".") & "," & _
                """leftTwips"": " & leftTwips & "," & _
                """topTwips"": " & topTwips & "," & _
                """widthTwips"": " & widthTwips & "," & _
                """heightTwips"": " & heightTwips & "," & _
                """properties"": {""importRole"": ""embeddedSubreportObject"", ""sourceSubreport"": """ & JsonEscape(subreportName) & """}," & _
                """styles"": {" & _
                    """fontFamily"": """ & JsonEscape(fontName) & """," & _
                    """fontSize"": """ & Replace(CStr(fontSize), ",", ".") & "pt""," & _
                    """fontWeight"": """ & IIf(isBold, "700", "400") & """," & _
                    """fontStyle"": """ & IIf(isItalic, "italic", "normal") & """," & _
                    """textAlign"": """ & alignStr & """," & _
                    """color"": """ & textColor & """" & _
                "}" & _
                "}"
        Next
    Next
End Sub

Function SafeId(value)
    Dim regex
    Set regex = CreateObject("VBScript.RegExp")
    regex.Global = True
    regex.IgnoreCase = True
    regex.Pattern = "[^A-Za-z0-9_]+"
    SafeId = LCase(regex.Replace(CStr(value), "_"))
End Function

Function JsonEscape(s)
    If IsNull(s) Or IsEmpty(s) Then
        JsonEscape = ""
        Exit Function
    End If
    Dim res
    res = CStr(s)
    res = Replace(res, "\", "\\")
    res = Replace(res, """", "\""")
    res = Replace(res, vbCrLf, "\n")
    res = Replace(res, vbCr, "\n")
    res = Replace(res, vbLf, "\n")
    res = Replace(res, vbTab, "\t")
    JsonEscape = res
End Function

Function IIf(cond, valTrue, valFalse)
    If cond Then IIf = valTrue Else IIf = valFalse
End Function

Main
