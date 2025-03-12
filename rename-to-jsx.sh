#!/bin/bash

# Array of component files to rename
declare -a components=(
    # Components
    "src/components/AccountSetup.js"
    "src/components/AppHead.js"
    "src/components/BibleReference.js"
    "src/components/Drawer.js"
    "src/components/ErrorPopUp.js"
    "src/components/FeedbackCard.js"
    "src/components/FeedbackPopup.js"
    "src/components/Header.js"
    "src/components/Layout.js"
    "src/components/NetlifyBadge.js"
    "src/components/NetworkErrorPopUp.js"
    "src/components/Onboarding.js"
    "src/components/PopoverComponent.js"
    "src/components/ResourceCard.js"
    "src/components/TranslationSettings.js"
    "src/components/WordAlignerArea.js"
    "src/components/WordAlignerDialog.js"
    "src/components/WorkspaceContainer.js"
    # Context
    "src/context/AuthContext.js"
    "src/context/StoreContext.js"
    # Pages
    "pages/_app.js"
    "pages/_document.js"
    "pages/settings.js"
    # Hooks
    "src/hooks/useWindowEvent.js"
    "src/hooks/useWindowDimensions.js"
    "src/hooks/useValidateAccountSettings.js"
    "src/hooks/useUserLocalStorage.js"
    "src/hooks/useUpdateCardsProps.js"
    "src/hooks/useSaveChangesPrompt.js"
    "src/hooks/useMergeCardsProps.js"
    "src/hooks/useLocalStorage.js"
    "src/hooks/useLexicon.js"
    "src/hooks/useFeedbackData.js"
    # Entry point
    "src/main.js"
)

# Function to rename a file using git mv
rename_to_jsx() {
    local file=$1
    if [ -f "$file" ]; then
        local new_file="${file%.js}.jsx"
        echo "Renaming $file to $new_file"
        git mv "$file" "$new_file"
    else
        echo "Warning: $file not found"
    fi
}

# Rename each component file
for file in "${components[@]}"; do
    rename_to_jsx "$file"
done

echo "Done renaming files. Please commit the changes."
