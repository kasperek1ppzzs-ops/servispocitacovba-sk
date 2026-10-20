/*
 * Verejné nastavenia stránky — tento súbor môže vidieť každý návštevník.
 * Nevkladajte sem heslá, API kľúče ani prihlasovacie údaje.
 * Podrobný postup nasadenia a aktivovania formulára nájdete v NAVOD.md.
 */
window.SITE_CONFIG = {
  business: {
    name: 'Servis počítačov BA',
    phone: '',                 // Napríklad +421 9xx xxx xxx; prázdny kontakt sa nezobrazí.
    email: '',                 // Skutočná kontaktná e-mailová adresa (ponechané prázdne).
    address: '',               // Adresa prevádzky (ponechané prázdne).
    hours: '',                 // Otváracie hodiny (ponechané prázdne).
    companyName: '',           // Obchodné meno prevádzkovateľa.
    companyId: '',             // IČO prevádzkovateľa.
    companyAddress: ''         // Sídlo prevádzkovateľa.
  },
  form: {
    /*
     * draft  = pripraví požiadavku na skopírovanie alebo stiahnutie; nič neodošle.
     * mailto = po odoslaní formulára otvorí e-mailový program návštevníka.
     * server = odošle požiadavku na PHP endpoint cez api/contact.php.
     */
    mode: 'server',
    endpoint: 'api/contact.php'
  },
  prices: {
    // null = zobrazí sa „Cena po diagnostike“. Príklad formátu: 'od … €'.
    oprava: null,
    upgrade: null,
    cistenie: null,
    data: null
  }
};
