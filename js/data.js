/*
  Loose Goose data file. This is the only place to edit facts in this demo.

  How unconfirmed data is shown:
  - confirmed: false shows the value with a "to be confirmed" tag.
  - null shows a bracketed placeholder, for example [phone to be confirmed].
  - Hours per day: null (not entered), "closed", or { open: "06:00", close: "18:00" } in 24-hour time.
  - hours.confirmed: false shows the status "Hours to be confirmed" and labels the table as sample hours.
  - When the owner confirms the hours, set hours.confirmed to true. The status then shows Open now or Closed now,
    computed in America/Indiana/Indianapolis time.

  The sample hours and the menu names come from public listings. They are not the owner's own information.
*/
window.LOOSE_GOOSE_DATA = {
  timeZone: "America/Indiana/Indianapolis",
  hoursLabel: "sample hours, to be confirmed",
  story: null,

  shops: [
    {
      id: "south",
      name: "Loose Goose South",
      shortName: "South",
      address: { line1: "3020 S 7th St", line2: "Terre Haute, IN 47802", confirmed: false },
      phone: { display: "(812) 917-3863", tel: "+18129173863", confirmed: false },
      service: null,
      entrance: null,
      hours: {
        confirmed: false,
        week: {
          monday: { open: "06:00", close: "18:00" },
          tuesday: { open: "06:00", close: "18:00" },
          wednesday: { open: "06:00", close: "18:00" },
          thursday: { open: "06:00", close: "18:00" },
          friday: { open: "06:00", close: "18:00" },
          saturday: { open: "07:00", close: "16:00" },
          sunday: { open: "08:00", close: "15:00" }
        }
      }
    },
    {
      id: "north",
      name: "Loose Goose North",
      shortName: "North",
      address: { line1: "1547 Lafayette Ave", line2: "Terre Haute, IN 47804", confirmed: false },
      phone: { display: null, tel: null, confirmed: false },
      service: { text: "Drive-thru", confirmed: false },
      entrance: null,
      hours: {
        confirmed: false,
        week: {
          monday: { open: "06:00", close: "18:00" },
          tuesday: { open: "06:00", close: "18:00" },
          wednesday: { open: "06:00", close: "18:00" },
          thursday: { open: "06:00", close: "18:00" },
          friday: { open: "06:00", close: "18:00" },
          saturday: { open: "07:00", close: "16:00" },
          sunday: { open: "08:00", close: "15:00" }
        }
      }
    }
  ],

  menu: {
    categories: [
      {
        id: "hot-drinks",
        name: "Hot Drinks",
        items: [
          { name: "Hot white mocha", featured: true },
          { name: "Brown sugar chai", featured: true }
        ]
      },
      {
        id: "cold-drinks",
        name: "Cold Drinks",
        items: [
          { name: "Loose Mocha", featured: true },
          { name: "Frozen snickerdoodle latte", featured: true },
          { name: "Smoothies", featured: false }
        ]
      },
      {
        id: "goose-juice",
        name: "Goose Juice",
        items: [
          { name: null, featured: false },
          { name: null, featured: false },
          { name: null, featured: false }
        ]
      },
      {
        id: "food",
        name: "Food",
        items: [
          { name: "Egg bites", featured: true },
          { name: "Glazed croissants", featured: true },
          { name: "Bagels", featured: false },
          { name: "Granola bars", featured: false }
        ]
      }
    ]
  },

  contact: {
    mainPhone: null,
    email: null
  },

  footer: {
    legalName: null,
    facebook: null,
    instagram: null,
    privacyPolicy: null,
    termsOfUse: null,
    accessibilityStatement: null,
    copyright: null
  }
};
