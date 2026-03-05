Write-Host "Checking project structure..." -ForegroundColor Yellow

# Check if components exist
$components = @(
    "src/components/Auth/Login.jsx",
    "src/components/Auth/Register.jsx",
    "src/components/Auth/PrivateRoute.jsx",
    "src/components/BootcamperPanel/BootcamperDashboard.jsx",
    "src/components/BootcamperPanel/ChangePassword.jsx",
    "src/components/BootcamperPanel/ProfileUpdate.jsx",
    "src/components/AdminPanel/AdminDashboard.jsx",
    "src/components/AdminPanel/AddBootcamper.jsx",
    "src/components/AdminPanel/SearchBootcamper.jsx",
    "src/components/AdminPanel/BootcamperTable.jsx"
)

foreach ($component in $components) {
    if (Test-Path $component) {
        Write-Host "✓ $component" -ForegroundColor Green
    } else {
        Write-Host "✗ $component (missing)" -ForegroundColor Red
        # Create directory if it doesn't exist
        $dir = Split-Path $component
        if (!(Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force
        }
        # Create a basic component
        @'import React from "react";

const Component = () => {
  return (
    <div>
      <h1>'@ + (Split-Path $component -Leaf) + @"</h1>
      <p>Component under development</p>
    </div>
  );
};

export default Component;
"@ | Out-File -FilePath $component -Encoding UTF8
        Write-Host "  Created placeholder for $component" -ForegroundColor Yellow
    }
}

Write-Host "`nProject structure check complete!" -ForegroundColor Green
