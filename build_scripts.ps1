$command = $args[0]

function Run_Backend {
    Write-Host "Starting Backend Server"

    Write-Host "Installing Dependencies"
    npm install 

    Write-Host "Starting Backend"
    node .\server.mjs
}

function Clean_Dist {
    $backend_dist_relative_path = "dist"

    if(Test-Path -Path $backend_dist_relative_path) {
        Remove-Item -Path $backend_dist_relative_path -Recurse
        Write-Host "Cleaning Dist Directory in Backend"
    } else {
        Write-Host "Dist Doesn't Exist"
    }
}

function Build {

    Clean_Dist

    Write-Host "Changing Directory to Frontend Directory"

    # use set location later on
    cd..
    cd Ultimate-TTT-frontend

    $frontend_path = Get-Location

    Write-Host "Installing Frontend Dependencies..."

    Start-Process npm "install" -NoNewWindow -Wait 
    # Start-Process npm run install -NoNewWindow -Wait

    Write-Host "After npm run install, Building Frontend"

    Start-Process npm "run", "build" -NoNewWindow -Wait 

    # Start-Process npm run build -NoNewWindow -Wait

    Write-Host "Frontend built"

    $dist_directory_path = Get-Location
    # $dist_ending = "/dist"

    Write-Host "Get Location for dist: $dist_directory_path"
    $dist_path = "" + (Get-Location) + "\dist"

    # k directory powershell script is running in 
    Move-Item -Path $dist_path -Destination $PSScriptRoot  -force

    Write-Host "Moved dist to backend."

    cd $PSScriptRoot

    Run_Backend
    # $PSScriptRoot    
}

# Git pulls latest code for both directories
# TODO: Nice to have, but not necessary
# function update { 
#     git pull

#     cd..
#     cd Ultimate-TTT-frontend

#     git pull 
# }


if($command -eq "clean") {
    Clean_Dist
} 
elseif($command -eq "build") {
    Build
}

# How to Use
# Be in this directory. To clean old distribution of frontend, be in powershell
# and type
# .\build_scripts.ps1 clean
# To build frontend and backend, do 
# .\build_scripts.ps1 build 