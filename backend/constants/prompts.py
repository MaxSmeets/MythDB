"""Prompt definitions for article types."""

DEFAULT_PROMPTS_PER_ARTICLE_TYPE = [
    # NPC prompts
    {
        "article_type_key": "npc",
        "prompt_key": "age",
        "prompt_text": "Age",
        "prompt_type": "text",
        "prompt_linked_type_key": None,
    },
    {
        "article_type_key": "npc",
        "prompt_key": "hometown",
        "prompt_text": "Home town",
        "prompt_type": "select",
        "prompt_linked_type_key": "settlement",
    },
    {
        "article_type_key": "npc",
        "prompt_key": "affiliation",
        "prompt_text": "Affiliation",
        "prompt_type": "select",
        "prompt_linked_type_key": "faction",
    },
    {
        "article_type_key": "npc",
        "prompt_key": "profession",
        "prompt_text": "Profession",
        "prompt_type": "select",
        "prompt_linked_type_key": "profession",
    },
    # Settlement prompts
    {
        "article_type_key": "settlement",
        "prompt_key": "population",
        "prompt_text": "Population",
        "prompt_type": "text",
        "prompt_linked_type_key": None,
    },
    {
        "article_type_key": "settlement",
        "prompt_key": "ruling_entity",
        "prompt_text": "Ruling Entity",
        "prompt_type": "select",
        "prompt_linked_type_key": "faction",
    },
    # Faction prompts
    {
        "article_type_key": "faction",
        "prompt_key": "founding_date",
        "prompt_text": "Founding Date",
        "prompt_type": "text",
        "prompt_linked_type_key": None,
    },
    {
        "article_type_key": "faction",
        "prompt_key": "headquarters",
        "prompt_text": "Headquarters",
        "prompt_type": "select",
        "prompt_linked_type_key": "settlement",
    },
    {
        "article_type_key": "faction",
        "prompt_key": "leader",
        "prompt_text": "Leader",
        "prompt_type": "select",
        "prompt_linked_type_key": "npc",
    }
]
