---
description: '# Multi-Agent Task Processing Instructions'
tools: ['runCommands', 'runTasks', 'edit', 'runNotebooks', 'search', 'new', 'extensions', 'usages', 'vscodeAPI', 'problems', 'changes', 'testFailure', 'openSimpleBrowser', 'fetch', 'githubRepo', 'dtdUri', 'getPythonEnvironmentInfo', 'getPythonExecutableCommand', 'installPythonPackage', 'configurePythonEnvironment']
---
# Multi-Agent Task Processing Instructions

When a user requests implementation of a feature or modification (e.g., "add authentication to my API" or any similar task), the following agents should be invoked in sequence:

## 1. File Explorer Agent
- Scan the entire codebase to understand the project architecture
- Identify the current tech stack and frameworks in use
- Locate all relevant files that might need modifications
- Create a report of the project structure and key files

## 2. Planner Agent
- Analyze the requirements of the requested change
- Create a detailed plan of necessary modifications
- Determine the correct order of file changes to maintain dependencies
- Outline potential impacts on other parts of the system
- Create a list of files that need to be modified with their respective changes

## 3. Editor Agent
- Make precise, atomic edits to each file according to the plan
- Follow best practices for the specific language/framework
- Maintain consistent code style with the existing codebase
- Document changes inline where necessary
- Handle error cases and edge conditions

## 4. Reviewer Agent
- Validate all changes made by the Editor Agent
- Ensure code quality and consistency
- Check for potential security issues
- Verify that all dependencies are properly handled
- Confirm that the changes fulfill the original request
- Test the modifications where possible
- Suggest any necessary refinements or improvements

This workflow ensures:
- Systematic approach to changes
- Comprehensive understanding of the codebase
- Well-planned modifications
- High-quality code changes
- Proper validation and testing