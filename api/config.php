<?php
declare(strict_types=1);

/*
 * Súkromné nastavenie formulára. Vyžaduje hosting s PHP 8.0 alebo novším.
 * Tento súbor neposkytujte ako statický text a nikdy ho nepremenujte na .txt.
 */
return [
    // Skutočná e-mailová schránka, do ktorej prichádzajú servisné požiadavky.
    'recipient' => 'peterkasperek.sk@gmail.com',

    // Existujúca odosielacia schránka vašej domény, povolená hostingom.
    // Nepoužívajte tu adresu návštevníka.
    'from_email' => 'info@servispocitacovba.sk',

    // Presný verejný pôvod webu bez cesty, napr. https://servispocitacovba.sk.
    'site_origin' => 'https://servispocitacovba.sk',
    'additional_origins' => [
        'https://www.servispocitacovba.sk',
        'http://localhost',
        'http://127.0.0.1'
    ],

    // Najviac päť pokusov z jednej IP adresy počas pätnástich minút.
    'rate_limit' => 5,
    'rate_window_seconds' => 900,

    // null = súkromný priečinok v systémovom dočasnom adresári.
    'rate_storage_dir' => null,

    // Voliteľné SMTP nastavenie pre hostingy (Websupport, Wedos, Gmail a pod.)
    // Ak je enabled false, použije sa natívna funkcia PHP mail().
    'smtp' => [
        'enabled' => false,
        'host' => 'smtp.websupport.sk',
        'port' => 465,               // 465 pre SSL alebo 587 pre TLS
        'encryption' => 'ssl',       // 'ssl' alebo 'tls'
        'username' => 'info@servispocitacovba.sk',
        'password' => '',            // Vyplňte heslo schránky pri zapnutí SMTP
        'timeout' => 15,
    ],
];
