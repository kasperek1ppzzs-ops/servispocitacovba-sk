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
     * server = odošle požiadavku na PHP endpoint cez api/contact.php (len hosting s PHP, nie GitHub Pages).
     * web3forms = odošle požiadavku cez službu Web3Forms na e-mail zadaný pri získaní kľúča.
     *             Bez platného accessKey sa formulár správa ako draft.
     */
    mode: 'web3forms',
    // Verejný prístupový kľúč z https://web3forms.com (nie je to heslo; e-mail sa z neho nedá zistiť).
    accessKey: '',
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
