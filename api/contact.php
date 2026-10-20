<?php
declare(strict_types=1);

// Formulár neprijíma prílohy, neposiela kópie návštevníkom a neukladá ich text.
ini_set('display_errors', '0');
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, max-age=0');
header('X-Content-Type-Options: nosniff');
header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'");

function respond(int $status, bool $ok, string $code, string $message): void
{
    http_response_code($status);
    echo json_encode(['ok' => $ok, 'code' => $code, 'message' => $message], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function textLength(string $value): int
{
    // Funguje aj na základnom PHP hostingu bez rozšírenia mbstring.
    return preg_match_all('/./us', $value, $unused) ?: 0;
}

function hasControls(string $value, bool $allowLineBreaks = false): bool
{
    return preg_match($allowLineBreaks ? '/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u' : '/[\x00-\x1F\x7F]/u', $value) === 1;
}

function validMailbox($value): bool
{
    return is_string($value) && strlen($value) <= 254 && !hasControls($value)
        && filter_var($value, FILTER_VALIDATE_EMAIL) !== false;
}

function normalizeOrigin($value): ?string
{
    if (!is_string($value) || $value === '' || hasControls($value)) {
        return null;
    }
    $parts = parse_url($value);
    if (!is_array($parts) || !isset($parts['scheme'], $parts['host'])
        || !in_array(strtolower($parts['scheme']), ['https', 'http'], true)
        || isset($parts['user']) || isset($parts['pass']) || isset($parts['query']) || isset($parts['fragment'])
        || (isset($parts['path']) && $parts['path'] !== '' && $parts['path'] !== '/')) {
        return null;
    }
    $scheme = strtolower($parts['scheme']);
    $port = $parts['port'] ?? ($scheme === 'https' ? 443 : 80);
    $suffix = (($scheme === 'https' && $port === 443) || ($scheme === 'http' && $port === 80)) ? '' : ':' . $port;
    return $scheme . '://' . strtolower($parts['host']) . $suffix;
}

function requiredText(array $payload, string $key, int $minimum, int $maximum, bool $allowLineBreaks = false): string
{
    if (!isset($payload[$key]) || !is_string($payload[$key])) {
        respond(422, false, 'invalid_fields', 'Skontrolujte vyplnené údaje a skúste to znova.');
    }
    $value = trim($payload[$key]);
    $length = textLength($value);
    if ($length < $minimum || $length > $maximum || hasControls($value, $allowLineBreaks)) {
        respond(422, false, 'invalid_fields', 'Skontrolujte vyplnené údaje a dĺžku opisu problému.');
    }
    return $value;
}

function sendViaSmtp(array $smtp, string $recipient, string $from, string $subject, string $body, string $replyTo): bool
{
    $host = (string) ($smtp['host'] ?? '');
    $port = (int) ($smtp['port'] ?? 465);
    $encryption = strtolower((string) ($smtp['encryption'] ?? 'ssl'));
    $username = (string) ($smtp['username'] ?? '');
    $password = (string) ($smtp['password'] ?? '');
    $timeout = max(5, min(60, (int) ($smtp['timeout'] ?? 15)));

    if ($host === '') {
        return false;
    }

    $transport = ($encryption === 'ssl') ? 'ssl://' : 'tcp://';
    $context = stream_context_create([
        'ssl' => [
            'verify_peer' => true,
            'verify_peer_name' => true,
            'allow_self_signed' => false,
        ]
    ]);

    $socket = @stream_socket_client(
        $transport . $host . ':' . $port,
        $errno,
        $errstr,
        $timeout,
        STREAM_CLIENT_CONNECT,
        $context
    );

    if (!$socket) {
        error_log("SMTP Connect Error: $errstr ($errno)");
        return false;
    }

    stream_set_timeout($socket, $timeout);

    $read = function () use ($socket): string {
        $data = '';
        while (!feof($socket)) {
            $line = fgets($socket, 512);
            if ($line === false) break;
            $data .= $line;
            if (isset($line[3]) && $line[3] === ' ') break;
        }
        return $data;
    };

    $send = function (string $cmd) use ($socket): void {
        fwrite($socket, $cmd . "\r\n");
    };

    $banner = $read();
    if (strncmp($banner, '220', 3) !== 0) {
        fclose($socket);
        return false;
    }

    $clientHost = (string) (gethostname() ?: 'localhost');
    $send('EHLO ' . $clientHost);
    $read();

    if ($encryption === 'tls') {
        $send('STARTTLS');
        $tlsRes = $read();
        if (strncmp($tlsRes, '220', 3) !== 0) {
            fclose($socket);
            return false;
        }
        if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
            fclose($socket);
            return false;
        }
        $send('EHLO ' . $clientHost);
        $read();
    }

    if ($username !== '' && $password !== '') {
        $send('AUTH LOGIN');
        $authPrompt = $read();
        if (strncmp($authPrompt, '334', 3) !== 0) {
            fclose($socket);
            return false;
        }
        $send(base64_encode($username));
        $passPrompt = $read();
        if (strncmp($passPrompt, '334', 3) !== 0) {
            fclose($socket);
            return false;
        }
        $send(base64_encode($password));
        $authRes = $read();
        if (strncmp($authRes, '235', 3) !== 0) {
            fclose($socket);
            return false;
        }
    }

    $send('MAIL FROM:<' . $from . '>');
    $fromRes = $read();
    if (strncmp($fromRes, '250', 3) !== 0) {
        fclose($socket);
        return false;
    }

    $send('RCPT TO:<' . $recipient . '>');
    $toRes = $read();
    if (strncmp($toRes, '250', 3) !== 0) {
        fclose($socket);
        return false;
    }

    $send('DATA');
    $dataRes = $read();
    if (strncmp($dataRes, '354', 3) !== 0) {
        fclose($socket);
        return false;
    }

    $headers = [
        'Date: ' . gmdate('D, d M Y H:i:s +0000'),
        'To: <' . $recipient . '>',
        'From: Servis pocitacov BA <' . $from . '>',
        'Reply-To: <' . $replyTo . '>',
        'Subject: =?UTF-8?B?' . base64_encode($subject) . '?=',
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: base64',
        'X-Mailer: ServisPocitacovBA/1.0',
    ];

    $payload = implode("\r\n", $headers) . "\r\n\r\n" . chunk_split(base64_encode($body)) . "\r\n.";
    $send($payload);
    $sendRes = $read();
    $ok = (strncmp($sendRes, '250', 3) === 0);

    $send('QUIT');
    fclose($socket);
    return $ok;
}

/** Atomický limit pokusov. Súbory obsahujú len čas a počet, nie obsah formulára. */
function enforceRateLimit(array $config): void
{
    $directory = $config['rate_storage_dir'] ?? (sys_get_temp_dir() . '/servispcba-' . substr(hash('sha256', __DIR__), 0, 20));
    if (!is_string($directory) || $directory === '' || is_link($directory)) {
        throw new RuntimeException('Invalid private storage.');
    }
    if (!is_dir($directory) && !@mkdir($directory, 0700, true) && !is_dir($directory)) {
        throw new RuntimeException('Private storage unavailable.');
    }
    $realDirectory = realpath($directory);
    $documentRoot = realpath($_SERVER['DOCUMENT_ROOT'] ?? dirname(__DIR__));
    if ($realDirectory === false || ($documentRoot !== false &&
        ($realDirectory === $documentRoot || strncmp($realDirectory, rtrim($documentRoot, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR, strlen(rtrim($documentRoot, DIRECTORY_SEPARATOR)) + 1) === 0))) {
        throw new RuntimeException('Rate storage must be outside the document root.');
    }

    // Per-install náhodný kľúč: IP adresa sa nikdy neukladá v čitateľnej podobe.
    $secretPath = $realDirectory . '/.secret';
    if (is_link($secretPath)) {
        throw new RuntimeException('Invalid secret file.');
    }
    $secretFile = @fopen($secretPath, 'c+');
    if ($secretFile === false || !flock($secretFile, LOCK_EX)) {
        throw new RuntimeException('Cannot lock private storage.');
    }
    $secret = stream_get_contents($secretFile);
    if (!is_string($secret) || strlen($secret) !== 64) {
        $secret = bin2hex(random_bytes(32));
        ftruncate($secretFile, 0);
        rewind($secretFile);
        if (fwrite($secretFile, $secret) !== strlen($secret) || !fflush($secretFile)) {
            flock($secretFile, LOCK_UN);
            fclose($secretFile);
            throw new RuntimeException('Cannot write private key.');
        }
    }
    @chmod($secretPath, 0600);
    flock($secretFile, LOCK_UN);
    fclose($secretFile);

    // REMOTE_ADDR pochádza zo servera; hlavičkám X-Forwarded-For sa nedôveruje.
    $address = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $path = $realDirectory . '/' . hash_hmac('sha256', $address, $secret) . '.json';
    if (is_link($path)) {
        throw new RuntimeException('Invalid counter file.');
    }
    $file = @fopen($path, 'c+');
    if ($file === false || !flock($file, LOCK_EX)) {
        throw new RuntimeException('Cannot lock rate counter.');
    }
    @chmod($path, 0600);
    $now = time();
    $limit = max(1, min(100, (int) ($config['rate_limit'] ?? 5)));
    $window = max(60, min(86400, (int) ($config['rate_window_seconds'] ?? 900)));
    $state = json_decode(stream_get_contents($file) ?: '{}', true);
    if (!is_array($state) || !isset($state['started'], $state['count']) || $now - (int) $state['started'] >= $window) {
        $state = ['started' => $now, 'count' => 0];
    }
    if ((int) $state['count'] >= $limit) {
        $retry = max(1, $window - ($now - (int) $state['started']));
        flock($file, LOCK_UN);
        fclose($file);
        header('Retry-After: ' . $retry);
        respond(429, false, 'rate_limited', 'V krátkom čase prišlo priveľa pokusov. Skúste to neskôr alebo využite priamy kontakt.');
    }
    $state['count'] = (int) $state['count'] + 1;
    $encoded = json_encode($state);
    ftruncate($file, 0);
    rewind($file);
    if (!is_string($encoded) || fwrite($file, $encoded) !== strlen($encoded) || !fflush($file)) {
        flock($file, LOCK_UN);
        fclose($file);
        throw new RuntimeException('Cannot write rate counter.');
    }
    flock($file, LOCK_UN);
    fclose($file);

    // Obmedzené priebežné upratovanie starých počítadiel bez čítania ich obsahu.
    $scanned = 0;
    foreach (new DirectoryIterator($realDirectory) as $entry) {
        if (++$scanned > 200) {
            break;
        }
        if ($entry->isFile() && !$entry->isLink() && preg_match('/^[a-f0-9]{64}\.json$/', $entry->getFilename())
            && $entry->getMTime() < $now - 86400) {
            @unlink($entry->getPathname());
        }
    }
}

try {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        header('Allow: POST');
        respond(405, false, 'method_not_allowed', 'Použite objednávkový formulár na stránke.');
    }
    $config = require __DIR__ . '/config.php';
    $origin = is_array($config) ? normalizeOrigin($config['site_origin'] ?? null) : null;
    if (!is_array($config) || !validMailbox($config['recipient'] ?? null) || !validMailbox($config['from_email'] ?? null) || $origin === null) {
        respond(503, false, 'not_configured', 'Online odoslanie momentálne nie je dostupné. Požiadavku si môžete stiahnuť a použiť priamy kontakt.');
    }
    $allowedOrigins = [$origin];
    foreach ((array) ($config['additional_origins'] ?? []) as $extra) {
        $normalized = normalizeOrigin($extra);
        if ($normalized !== null) {
            $allowedOrigins[] = $normalized;
        }
    }
    $requestOrigin = normalizeOrigin($_SERVER['HTTP_ORIGIN'] ?? null);
    if ($requestOrigin === null || !in_array($requestOrigin, $allowedOrigins, true)
        || ($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '') === 'cross-site') {
        respond(403, false, 'origin_rejected', 'Otvorte formulár priamo na stránke servisu a skúste to znova.');
    }
    $type = strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0]));
    if ($type !== 'application/json') {
        respond(415, false, 'invalid_content_type', 'Požiadavka má nepodporovaný formát.');
    }
    if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 16384) {
        respond(413, false, 'request_too_large', 'Požiadavka je príliš dlhá. Skráťte opis problému.');
    }
    enforceRateLimit($config);
    $input = file_get_contents('php://input', false, null, 0, 16385);
    if ($input === false || strlen($input) > 16384) {
        respond(413, false, 'request_too_large', 'Požiadavka je príliš dlhá. Skráťte opis problému.');
    }
    try {
        $payload = json_decode($input, true, 16, JSON_THROW_ON_ERROR);
    } catch (JsonException $error) {
        respond(400, false, 'invalid_json', 'Požiadavku sa nepodarilo prečítať. Skúste formulár odoslať znova.');
    }
    if (!is_array($payload) || (array_key_exists('website', $payload) && (!is_string($payload['website']) || trim($payload['website']) !== ''))) {
        respond(400, false, 'invalid_request', 'Požiadavku sa nepodarilo spracovať.');
    }
    $name = requiredText($payload, 'name', 2, 120);
    $email = requiredText($payload, 'email', 3, 254);
    $problem = requiredText($payload, 'problem', 15, 3000, true);
    $phone = $payload['phone'] ?? '';
    if (!validMailbox($email) || !is_string($phone) || hasControls($phone)
        || (trim($phone) !== '' && !preg_match('/^[+0-9(). -]{6,40}$/', trim($phone)))
        || ($payload['privacyAcknowledged'] ?? false) !== true) {
        respond(422, false, 'invalid_fields', 'Skontrolujte e-mail, telefón a potvrdenie informácií o súkromí.');
    }
    $devices = ['notebook' => 'Notebook', 'pc' => 'Stolový počítač', 'mac' => 'Mac / MacBook', 'ine' => 'Iné zariadenie'];
    $services = ['oprava' => 'Oprava', 'upgrade' => 'Zrýchlenie / upgrade', 'cistenie' => 'Čistenie a chladenie', 'data' => 'Dáta a systém', 'ine' => 'Potrebujem poradiť'];
    $device = $payload['device'] ?? '';
    $service = $payload['service'] ?? '';
    if (!is_string($device) || !isset($devices[$device]) || !is_string($service) || !isset($services[$service])) {
        respond(422, false, 'invalid_fields', 'Vyberte typ zariadenia a požadovanú službu.');
    }
    $reference = 'PCBA-' . gmdate('Ymd') . '-' . strtoupper(bin2hex(random_bytes(3)));
    $body = "Nová servisná požiadavka\nReferencia: {$reference}\nČas (UTC): " . gmdate('Y-m-d H:i:s')
        . "\n\nMeno: {$name}\nE-mail: {$email}\nTelefón: " . (trim($phone) ?: 'Neuvedený')
        . "\nZariadenie: {$devices[$device]}\nSlužba: {$services[$service]}\n\nOpis problému:\n{$problem}"
        . "\n\nNávštevník potvrdil oboznámenie sa s informáciami o súkromí.\n"
        . "Toto je žiadosť o kontakt, nie potvrdená rezervácia ani záväzná objednávka opravy.\n";
    $subjectText = 'Servis počítačov BA – nová požiadavka [' . $reference . ']';
    $sent = false;

    if (!empty($config['smtp']['enabled'])) {
        $sent = sendViaSmtp($config['smtp'], $config['recipient'], $config['from_email'], $subjectText, $body, $email);
    } else {
        $headers = [
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset=UTF-8',
            'Content-Transfer-Encoding: base64',
            'From: Servis pocitacov BA <' . $config['from_email'] . '>',
            'Reply-To: ' . $email,
            'X-Auto-Response-Suppress: All',
        ];
        $subject = '=?UTF-8?B?' . base64_encode($subjectText) . '?=';
        $sent = @mail($config['recipient'], $subject, chunk_split(base64_encode($body)), implode("\r\n", $headers));
    }

    if (!$sent) {
        respond(502, false, 'delivery_failed', 'Požiadavku sa nepodarilo odoslať. Stiahnite si ju alebo využite priamy kontakt.');
    }
    // mail() potvrdzuje prijatie lokálnym mailovým transportom, nie doručenie do schránky.
    respond(200, true, 'accepted', 'Ďakujeme. Požiadavka bola prijatá na odoslanie. Termín opravy vám servis potvrdí osobitne.');
} catch (Throwable $error) {
    error_log('ServisPCBA contact: internal request processing failure.');
    respond(500, false, 'server_error', 'Odoslanie momentálne nefunguje. Požiadavku si môžete stiahnuť a použiť priamy kontakt.');
}
