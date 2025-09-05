#!/bin/bash
# Auto GitHub Uploader for Termux
# By pankaj9055

# Project path
PROJECT="/sdcard/Document/Electro"

# GitHub details
USER="pankaj9055"
EMAIL="pankajmanmar43@gmail.com"
REPO="bugyh"
BRANCH="main"

cd "$PROJECT" || { echo "❌ Project folder not found!"; exit 1; }

# Clean old repo
rm -rf .git

# Init new repo with main branch
git init -b $BRANCH

# Config user
git config user.name "$USER"
git config user.email "$EMAIL"

# Add remote with token
git remote add origin "https://$USER:$TOKEN@github.com/$USER/$REPO.git"

# Add + Commit + Push
git add .
git commit -m "first commit"
git push -u origin $BRANCH --force

echo "✅ Code uploaded successfully!"
