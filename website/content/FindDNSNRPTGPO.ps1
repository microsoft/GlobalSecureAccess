
# =========================================================================

# THIS CODE-SAMPLE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND, EITHER 

# EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE IMPLIED WARRANTIES 

# OF MERCHANTABILITY AND/OR FITNESS FOR A PARTICULAR PURPOSE.

#

# This sample is not supported under any Microsoft standard support program 

# or service. The code sample is provided AS IS without warranty of any kind. 

# Microsoft further disclaims all implied warranties including, without 

# limitation, any implied warranties of merchantability or of fitness for a 

# particular purpose. The entire risk arising out of the use or performance

# of the sample and documentation remains with you. In no event shall 

# Microsoft, its authors, or anyone else involved in the creation, 

# production, or delivery of the script be liable for any damages whatsoever 

# (including, without limitation, damages for loss of business profits, 

# business interruption, loss of business information, or other pecuniary 

# loss) arising out of  the use of or inability to use the sample or 

# documentation, even if Microsoft has been advised of the possibility of 

# such damages.

#=========================================================================
# This script helps identifying Group Policies managing DNS NRPT rules.

# Define the SYSVOL share path

$sysvolPath = "\\<DC Fqdn>\sysvol\"
 
# Define the search string

$searchString = "dnspolicyconfig"
 
# Define the name of the file to search

$fileName = "registry.pol"
 
# Get all the registry.pol files under the SYSVOL share

$files = Get-ChildItem -Path $sysvolPath -Recurse -Filter $fileName -File
 
# Array to store paths of files that contain the search string

$matchingFiles = @()
 
# Loop through each file and check if it contains the search string

foreach ($file in $files) {

    try {

        # Read the content of the file

        $content = Get-Content -Path $file.FullName -Encoding Unicode

        # Check if the content contains the search string

        if ($content -like "*$searchString*") {

            $matchingFiles += $file.FullName

        }

    } catch {

        Write-Host "Failed to read file $($file.FullName): $_"

    }

}
 
# Output the matching file paths

if ($matchingFiles.Count -eq 0) {

    Write-Host "No files containing '$searchString' were found."

} else {

    Write-Host "Files containing '$searchString':"

    $matchingFiles | ForEach-Object { Write-Host $_ }

}
