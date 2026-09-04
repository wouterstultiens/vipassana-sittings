 $grilling

  Here's how I have it in mind:

  User visits website.
  User logs in with global old student login and password (every old student knows this one and it's only one logina dn password)
  User has calendar view and can filter on what they want (e.g. short/long sits, when, etc.)
  When they find one they can click on it and a popup modal will appear or some element on the webpage changes with the details
  Details are only enough information to know about the sit, and to schedule it, and the link and an ics invite. Basically all information that they need to attend the sit.
  So I think almost everything that you said should be in there. BUt I don't know exactly what would be best.

  Then the process will be this:
  Once, I parse with a coding agent all output of the API to structured data
  This data will be stored in the repo
  This will be shown to the user
  Every [TIME_PERIOD], a checker will run to see if the exact fields of the event have changed. Doesn't matter what field, any field.
  Then, for that only, a LLM call will be done to make changes to the existing structured fields
  Those fields will be updated.


  Site in Astro + Shadcn UI elements, developed locally for now. I will decide later where to host it

