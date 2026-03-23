Skills
======
Each subdirectory is one skill. An agent can have multiple skills.

Every skill folder must contain a SKILL.md file with YAML frontmatter
(name, description) followed by markdown instructions.

Required per skill:
  SKILL.md          - Metadata + instructions

Optional sub-folders per skill:
  scripts/          - Executable code (Python, Bash, JS)
  references/       - Additional documentation
  assets/           - Templates, images, data files

See https://agentskills.io/specification for the full spec.
