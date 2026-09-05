// One listing on https://www.dhamma.org/api/v1/events/virtual, limited to the
// fields the pipeline reads.
export type ApiListing = {
  id: number;
  name: string;
  short_description: string | null;
  description: string;
  url: string | null;
  schedule: string | null;
  event_instruction_languages: string[];
  sub_location: {
    name: string;
    description: string | null;
    url: string | null;
    contact_email: string | null;
    city: string | null;
    country_iso_code: string;
    time_zone: string;
  };
};
