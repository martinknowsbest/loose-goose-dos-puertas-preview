/*
  Loose Goose: verified facts only.
  Sources: Tribune-Star (Dec 2, 2024); PRWeb press release (Feb 19, 2022);
  Roadtrippers and MapQuest listings (South hours and phone, which agree);
  joe.coffee listing (North address only; its hours conflict with the Tribune-Star).
*/
window.LOOSE_GOOSE_DATA = {
  timeZone: "America/Indiana/Indianapolis",
  shops: [
    {
      id: "south",
      name: "Loose Goose South",
      shortName: "South",
      address: { line1: "3020 S 7th St", line2: "Terre Haute, IN 47802" },
      phone: { display: "(812) 917-3863", tel: "+18129173863" },
      tags: ["Drive-thru", "Coffee", "Goose Juice"],
      hours: {
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
      address: { line1: "1547 Lafayette Ave", line2: "Terre Haute, IN 47804" },
      phone: null,
      tags: ["Drive-thru only", "Coffee", "Goose Juice"],
      hours: null
    }
  ],
  menu: [
    { id: "coffee", name: "Coffee drinks", items: ["Loose Mocha, the signature", "Lattes", "Mochas"] },
    { id: "energy", name: "Energy drinks", items: ["Goose Juice, a flavored energy drink"] },
    { id: "bakery", name: "Pastries and bagels", items: ["Pastries", "Bagels with flavored cream cheese"] }
  ],
  links: {
    facebook: "https://www.facebook.com/Loose-Goose-Coffee-Company-101215739033765",
    yelp: "https://www.yelp.com/biz/loose-goose-coffee-company-terre-haute",
    googleReviews: "https://www.google.com/maps/search/?api=1&query=Loose+Goose+Coffee+Company+Terre+Haute"
  }
};
