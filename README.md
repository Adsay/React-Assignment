# Artworks Data Table (React Internship Assignment)

This project is built using React + TypeScript with Vite and PrimeReact DataTable.

The app fetches artwork data from the Art Institute of Chicago API and displays it in a table with server-side pagination and persistent row selection.


## What this project does

- Fetches artwork data from the API
- Shows data in a PrimeReact DataTable
- Supports pagination (data is fetched page by page)
- Allows selecting rows using checkboxes
- Selection stays even when changing pages
- Custom selection panel to select n number of rows


## API used

https://api.artic.edu/api/v1/artworks?page=1


## Tech stack

- React (Vite)
- TypeScript
- PrimeReact
- PrimeIcons


## Main features

### Server-side pagination

Data is not loaded all at once.  
Whenever the page changes, a new API call is made.


### Row selection

- Select individual rows
- Select all rows on current page
- Custom selection using input box


### Persistent selection

Selected rows remain selected when moving between pages.

This is handled by storing only row IDs instead of storing full row data.


## Important implementation note

The assignment specifically mentions not to prefetch data from other pages.

So in this project:

- Only current page data is stored
- No extra API calls for bulk selection
- Selection logic works using ID sets

