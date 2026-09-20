# Norsk modellrevisjon — `Abyssal/intent-classifier-general-acv3:1.5b`

- 10008 reelle API-kall, temperatur 0, `no/output/results_no_10k_en_acv3.csv`
- Korpus: 940 caser, 128 intensjoner, 16 domener, 12 exact-prober

## Sammendragstabell

| variant | modus | N | topp-1 treff | i liste | truffet | median ms |
|---|---|---|---|---|---|---|
| exact | free | 36 | 91.7% | 100.0% | 100.0% | 465 |
| exact | enum | 36 | 75.0% | 100.0% | 100.0% | 464 |
| native_in_random | free | 1880 | 96.5% | 99.6% | 99.6% | 507 |
| native_in_random | enum | 1880 | 92.1% | 100.0% | 100.0% | 522 |
| native_in_nearsyn | free | 745 | 95.4% | 99.9% | 99.9% | 519 |
| native_in_nearsyn | enum | 745 | 89.7% | 100.0% | 100.0% | 520 |
| native_out | free | 926 | 0.0% | 99.9% | 99.9% | 522 |
| custom_in | free | 1880 | 96.2% | 99.9% | 99.9% | 499 |
| custom_in | enum | 1880 | 94.4% | 100.0% | 100.0% | 521 |

## Porter (gates)

- exact free = 100: 91.7% → **IKKE BESTÅTT**
- inscope >= 94: 94.3% → **BESTÅTT**
- nearsyn free >= 94: 95.4% → **BESTÅTT**
- custom free >= 88: 96.2% → **BESTÅTT**
- in-list = 100: 99.9% → **IKKE BESTÅTT**

**Merk om enum-modus:** enum-tallene scorer systematisk lavere enn fri generering fordi svaret må starte med `"`, noe modellen aldri så i trening. Det er en harness-artefakt, ikke en modellegenskap – fri generering er fasit for norsk acv3.

**Definisjoner**
- `exact`: håndplukkede, reelle norske prober (hver kjørt 3x per modus).
- `native_in_random`: korrekt intensjon + 3 tilfeldige distraksjoner fra samme domene (nær-synonymer kan forekomme tilfeldig), 2 trekk.
- `native_in_nearsyn`: korrekt intensjon + en **tvungen nær-synonym**-distraksjon (f.eks. `dekning_mobil` mot `dekning_forsikring`) – modellens favorittetikett ER tilbudt. Dette er felletesten.
- `native_out`: korrekt intensjon er **ikke** tilbudt. Norsk acv3 er accept-bias og skal alltid velge beste treff – fri generering i liste = listelydighet, ikke avvisning.
- `custom_in`: intensjonene er omdøpt til oppfunnede navn modellen aldri så (generalisering på åpen mengde).
- `enum`: `format: {type:string, enum:[...]}` grammatikkbegrenset dekoding – kan strukturelt ikke forlate listen.

## Exact-prober (meldingene som betyr noe i praksis)

Hver probe er kjørt 3x per modus. `stabil` = alle 3 repetisjoner ga samme svar.

| probe | modus | svar (3 kjøringer) | stabil | treff | i liste |
|---|---|---|---|---|---|
| `sporing` P0 | free | ['sporing', 'sporing', 'sporing'] | ja | 3/3 | 3/3 |
| `sporing` P0 | enum | ['sporing', 'sporing', 'sporing'] | ja | 3/3 | 3/3 |
| `refusjon` P1 | free | ['defekt_vare', 'defekt_vare', 'defekt_vare'] | ja | 0/3 | 3/3 |
| `refusjon` P1 | enum | ['defekt_vare', 'defekt_vare', 'defekt_vare'] | ja | 0/3 | 3/3 |
| `sporing` P2 | free | ['sporing', 'sporing', 'sporing'] | ja | 3/3 | 3/3 |
| `sporing` P2 | enum | ['sporing_mat', 'sporing_mat', 'sporing_mat'] | ja | 0/3 | 3/3 |
| `kanseller_bestilling` P3 | free | ['kanseller_bestilling', 'kanseller_bestilling', 'kanseller_bestilling'] | ja | 3/3 | 3/3 |
| `kanseller_bestilling` P3 | enum | ['kanseller_bestilling', 'kanseller_bestilling', 'kanseller_bestilling'] | ja | 3/3 | 3/3 |
| `dekning_forsikring` P4 | free | ['dekning_forsikring', 'dekning_forsikring', 'dekning_forsikring'] | ja | 3/3 | 3/3 |
| `dekning_forsikring` P4 | enum | ['dekning_forsikring', 'dekning_forsikring', 'dekning_forsikring'] | ja | 3/3 | 3/3 |
| `dekning_mobil` P5 | free | ['dekning_mobil', 'dekning_mobil', 'dekning_mobil'] | ja | 3/3 | 3/3 |
| `dekning_mobil` P5 | enum | ['dekning_mobil', 'dekning_mobil', 'dekning_mobil'] | ja | 3/3 | 3/3 |
| `refusjon` P6 | free | ['refusjon', 'refusjon', 'refusjon'] | ja | 3/3 | 3/3 |
| `refusjon` P6 | enum | ['refusjon', 'refusjon', 'refusjon'] | ja | 3/3 | 3/3 |
| `feil_vare` P7 | free | ['feil_vare', 'feil_vare', 'feil_vare'] | ja | 3/3 | 3/3 |
| `feil_vare` P7 | enum | ['feil_vare', 'feil_vare', 'feil_vare'] | ja | 3/3 | 3/3 |
| `billettrefusjon` P8 | free | ['billettrefusjon', 'billettrefusjon', 'billettrefusjon'] | ja | 3/3 | 3/3 |
| `billettrefusjon` P8 | enum | ['kanseller_bestilling', 'kanseller_bestilling', 'kanseller_bestilling'] | ja | 0/3 | 3/3 |
| `konto_gjenoppretting` P9 | free | ['konto_gjenoppretting', 'konto_gjenoppretting', 'konto_gjenoppretting'] | ja | 3/3 | 3/3 |
| `konto_gjenoppretting` P9 | enum | ['konto_gjenoppretting', 'konto_gjenoppretting', 'konto_gjenoppretting'] | ja | 3/3 | 3/3 |
| `sporing_mat` P10 | free | ['sporing_mat', 'sporing_mat', 'sporing_mat'] | ja | 3/3 | 3/3 |
| `sporing_mat` P10 | enum | ['sporing_mat', 'sporing_mat', 'sporing_mat'] | ja | 3/3 | 3/3 |
| `fravaer` P11 | free | ['fravaer', 'fravaer', 'fravaer'] | ja | 3/3 | 3/3 |
| `fravaer` P11 | enum | ['fravaer', 'fravaer', 'fravaer'] | ja | 3/3 | 3/3 |

**Eksakte ledetekster (for reproduksjon):**

### P0 `sporing` — Hvor er pakken min? Den skulle komme i går.

```
sporing: Brukeren vil vite hvor pakken eller forsendelsen er, sporingsnummer eller om pakken er sendt
leveringstid: Brukeren spør når bestillingen kommer, hvor lang tid levering tar, leveringsdato eller leveringsvindu
bestillingsstatus: Brukeren spør om status, bekreftelse eller behandlingstid på en bestilling/ordre (ikke hvor pakken er)
retur: Brukeren vil returnere eller bytte en vare, eller spør om returfrist, returlapp og returprosess
```

### P1 `refusjon` — Jeg vil ha pengene tilbake, varen var ødelagt.

```
refusjon: Brukeren vil ha pengene tilbake for et kjøp, få refundert eller reversert en betaling – også når varen var defekt eller feil (ikke avbestilling)
retur: Brukeren vil returnere eller bytte en vare, eller spør om returfrist, returlapp og returprosess
defekt_vare: Brukeren mottok en ødelagt, skadet eller defekt vare, eller det manglet deler i pakken
garanti: Brukeren spør om garanti: om varen er dekket, hva garantien dekker, garantitid eller garantireparasjon
```

### P2 `sporing` — Kor er pakka mi?

```
sporing: Brukeren vil vite hvor pakken eller forsendelsen er, sporingsnummer eller om pakken er sendt
sporing_mat: Brukeren vil spore matleveransen eller vite hvor budet er og hvor langt igjen det er
bestillingsstatus: Brukeren spør om status, bekreftelse eller behandlingstid på en bestilling/ordre (ikke hvor pakken er)
leveringstid: Brukeren spør når bestillingen kommer, hvor lang tid levering tar, leveringsdato eller leveringsvindu
```

### P3 `kanseller_bestilling` — Eg vil avbestilla ordren min før ho blir sendt.

```
kanseller_bestilling: Brukeren vil avbestille, stoppe eller annullere en bestilling/ordre før den sendes
retur: Brukeren vil returnere eller bytte en vare, eller spør om returfrist, returlapp og returprosess
refusjon: Brukeren vil ha pengene tilbake for et kjøp, få refundert eller reversert en betaling – også når varen var defekt eller feil (ikke avbestilling)
avbestille_reise: Brukeren vil avbestille fly, hotell eller reise, eller spør om avbestillingsvilkår og refusjon ved avbestilling
```

### P4 `dekning_forsikring` — Dekker forsikringen sykkeltyveri?

```
dekning_forsikring: Brukeren spør hva forsikringen dekker eller ikke dekker, f.eks. tyveri, lekkasje eller om den gjelder i utlandet
skademelding: Brukeren vil melde en skade, bestille skadeskjema eller spør om behandlingstid på en skadesak
egenandel: Brukeren spør om egenandelen sin, beløp, eller vil endre egenandel
tilbud: Brukeren vil ha pristilbud eller prisberegning på en forsikring (innbo, hus, bil)
```

### P5 `dekning_mobil` — Hvorfor har jeg dårlig dekning på hytta?

```
dekning_mobil: Brukeren spør om mobildekning eller nettdekning, eller opplever dårlig dekning eller mister signal
mobildata_bruk: Brukeren spør om databruk, er tom for data eller vil kjøpe mer data
klage_tele: Brukeren vil sende en klage på teleoperatøren, tjenesten, fakturering eller nedetid, eller snakke med en leder
dekning_forsikring: Brukeren spør hva forsikringen dekker eller ikke dekker, f.eks. tyveri, lekkasje eller om den gjelder i utlandet
```

### P6 `refusjon` — Kan jeg få refundert betalingen hvis jeg angrer?

```
refusjon: Brukeren vil ha pengene tilbake for et kjøp, få refundert eller reversert en betaling – også når varen var defekt eller feil (ikke avbestilling)
billettrefusjon: Brukeren vil ha refusjon for billetter, eller spør hva som skjer med billetten ved avlyst eller utsatt arrangement
retur: Brukeren vil returnere eller bytte en vare, eller spør om returfrist, returlapp og returprosess
kanseller_bestilling: Brukeren vil avbestille, stoppe eller annullere en bestilling/ordre før den sendes
```

### P7 `feil_vare` — Jeg fikk feil størrelse, dette er ikke det jeg bestilte.

```
feil_vare: Brukeren mottok feil vare, feil farge, størrelse eller modell – noe annet enn det som ble bestilt
retur: Brukeren vil returnere eller bytte en vare, eller spør om returfrist, returlapp og returprosess
defekt_vare: Brukeren mottok en ødelagt, skadet eller defekt vare, eller det manglet deler i pakken
bytte_selskap: Brukeren vil bytte forsikringsselskap eller spør hva som skjer ved bytte, gebyr eller overtakelse
```

### P8 `billettrefusjon` — Arrangementet ble avlyst, når får jeg pengene?

```
billettrefusjon: Brukeren vil ha refusjon for billetter, eller spør hva som skjer med billetten ved avlyst eller utsatt arrangement
refusjon: Brukeren vil ha pengene tilbake for et kjøp, få refundert eller reversert en betaling – også når varen var defekt eller feil (ikke avbestilling)
konsertbillett: Brukeren vil kjøpe konsertbilletter eller spør om konserten, utsolgt eller VIP-billetter
kanseller_bestilling: Brukeren vil avbestille, stoppe eller annullere en bestilling/ordre før den sendes
```

### P9 `konto_gjenoppretting` — Kontoen min ble hacket

```
konto_gjenoppretting: Brukeren er låst ute, kontoen er hacket eller stjålet, og vil få tilgangen til kontoen tilbake
slett_konto: Brukeren vil slette, deaktivere eller avslutte kontoen sin og få dataene fjernet
innlogging: Brukeren får ikke logget inn: feilmelding, passordet avvises eller kommer ikke inn på kontoen
passord_reset: Brukeren vil tilbakestille, endre eller har glemt passordet, eller passordlenken virker ikke
```

### P10 `sporing_mat` — Hvor er budet mitt?

```
sporing_mat: Brukeren vil spore matleveransen eller vite hvor budet er og hvor langt igjen det er
bestillingsstatus_mat: Brukeren spør om status eller bekreftelse på matbestillingen, eller hvor lang tid maten tar
leveringstid: Brukeren spør når bestillingen kommer, hvor lang tid levering tar, leveringsdato eller leveringsvindu
sporing: Brukeren vil vite hvor pakken eller forsendelsen er, sporingsnummer eller om pakken er sendt
```

### P11 `fravaer` — Må jeg melde fravær?

```
fravaer: Brukeren vil melde fravær fra jobb, be om fri, eller spør om egenmeldingsdager og hva som må sendes ved sykdom
ferie: Brukeren vil søke om ferie eller spør om feriedager og feriepenger
sykmelding: Brukeren spør om sykmelding eller egenmelding: sende, registrere eller forlenge sykmelding
sykepenger: Brukeren spør om utbetaling av sykepenger, redusert beløp eller søknad om sykepenger
```

## native_in_nearsyn (nær-synonym-felle, fri mot enum)

- fri: 95.4% topp-1, 99.9% i liste.
- enum: 89.7% topp-1, 100.0% i liste.

Feil i fri generering (gold → valgt): `overforing`→`utenlandsbetaling` x3, `abonnement_mobil`→`endre_abonnement` x2, `klage_tele`→`dekning_mobil` x2, `strommeproblem`→`aldersgrense` x2, `sporing`→`bestillingsstatus` x1, `defekt_vare`→`feil_vare` x1, `feil_vare`→`defekt_vare` x1, `innlogging`→`konto_gjenoppretting` x1, `konto_gjenoppretting`→`passord_reset` x1, `bordbestilling`→`takeaway` x1, `allergi`→`meny` x1, `tur_bestilling`→`leiebil` x1, `stromavtale`→`avtaler` x1, `gruppetime`→`book_time` x1, `jobbsoknad`→`intervju` x1

| gold | fri treff | fri i liste | enum treff | enum i liste |
|---|---|---|---|---|
| `abonnement_mobil` | 75% (n=8) | 100% | 75% (n=8) | 100% |
| `aldersgrense` | 100% (n=7) | 100% | 71% (n=7) | 100% |
| `allergi` | 86% (n=7) | 100% | 100% (n=7) | 100% |
| `annonser_klage` | 100% (n=8) | 100% | 75% (n=8) | 100% |
| `avbestille_reise` | 100% (n=8) | 100% | 100% (n=8) | 100% |
| `avbryt_stromming` | 100% (n=6) | 100% | 100% (n=6) | 100% |
| `avlys_bord` | 100% (n=8) | 100% | 100% (n=8) | 100% |
| `bagasje` | 100% (n=8) | 100% | 100% (n=8) | 100% |
| `bestillingsstatus` | 100% (n=9) | 100% | 89% (n=9) | 100% |
| `bestillingsstatus_mat` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `betalingsmetode` | 100% (n=9) | 100% | 89% (n=9) | 100% |
| `billettrefusjon` | 100% (n=7) | 100% | 14% (n=7) | 100% |
| `blokkert_innhold` | 100% (n=7) | 100% | 57% (n=7) | 100% |
| `book_time` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `bordbestilling` | 75% (n=8) | 100% | 75% (n=8) | 100% |
| `bytte_leverandor` | 86% (n=7) | 100% | 86% (n=7) | 100% |
| `bytte_selskap` | 100% (n=8) | 100% | 100% (n=8) | 100% |
| `catering` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `data_nedlasting` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `defekt_vare` | 88% (n=8) | 100% | 88% (n=8) | 100% |
| `dekning_forsikring` | 91% (n=11) | 100% | 55% (n=11) | 100% |
| `dekning_mobil` | 100% (n=11) | 100% | 100% (n=11) | 100% |
| `depositum` | 100% (n=7) | 100% | 86% (n=7) | 100% |
| `drikkepenger` | 100% (n=6) | 100% | 100% (n=6) | 100% |
| `egenandel` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `eksamensplan` | 86% (n=7) | 100% | 0% (n=7) | 100% |
| `endre_abonnement` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `endre_epost` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `endre_leiekontrakt` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `fastlegebytte` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `feil_ordre` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `feil_vare` | 88% (n=8) | 100% | 88% (n=8) | 100% |
| `ferie` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `flybestilling` | 100% (n=8) | 100% | 88% (n=8) | 100% |
| `flystatus` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `forerkort_fornye` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `fornyelse` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `frakt_kostnad` | 100% (n=9) | 100% | 100% (n=9) | 100% |
| `fravaer` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `frys_medlemskap` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `gavekort` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `gruppetime` | 86% (n=7) | 100% | 86% (n=7) | 100% |
| `husleie` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `innlogging` | 89% (n=9) | 100% | 78% (n=9) | 100% |
| `innsjekking` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `intervju` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `jobbsoknad` | 86% (n=7) | 100% | 71% (n=7) | 100% |
| `kanseller_bestilling` | 100% (n=10) | 100% | 100% (n=10) | 100% |
| `karakterklage` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `kinobilletter` | 86% (n=7) | 100% | 86% (n=7) | 100% |
| `klage_tele` | 71% (n=7) | 100% | 71% (n=7) | 100% |
| `konsertbillett` | 86% (n=7) | 100% | 100% (n=7) | 100% |
| `konto_gjenoppretting` | 86% (n=7) | 100% | 86% (n=7) | 100% |
| `konto_gjenoppretting_sm` | 86% (n=7) | 100% | 100% (n=7) | 100% |
| `kortproblemer` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `kurs_pamelding` | 86% (n=7) | 100% | 100% (n=7) | 100% |
| `kursregistrering` | 100% (n=6) | 100% | 100% (n=6) | 100% |
| `legetime` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `leveringstid` | 100% (n=10) | 100% | 100% (n=10) | 100% |
| `manglende_vare` | 83% (n=6) | 100% | 67% (n=6) | 100% |
| `meny` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `mistet_kort` | 100% (n=7) | 100% | 43% (n=7) | 100% |
| `mobildata_bruk` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `nabo_klage` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `nummerportering` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `oppsigelse` | 100% (n=7) | 100% | 86% (n=7) | 100% |
| `overforing` | 62% (n=8) | 100% | 62% (n=8) | 100% |
| `pass_fornye` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `passord_reset` | 100% (n=7) | 100% | 86% (n=7) | 100% |
| `personlig_trener` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `personvern` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `proveperiode` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `rabatt_mat` | 100% (n=7) | 100% | 57% (n=7) | 100% |
| `rabattkode` | 100% (n=8) | 100% | 88% (n=8) | 100% |
| `refusjon` | 100% (n=12) | 100% | 83% (n=12) | 100% |
| `resept_fornye` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `retur` | 100% (n=11) | 100% | 100% (n=11) | 100% |
| `saldo` | 88% (n=8) | 100% | 100% (n=8) | 100% |
| `sjafor_vurdering` | 100% (n=6) | 100% | 100% (n=6) | 100% |
| `skademelding` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `slett_konto` | 100% (n=9) | 100% | 100% (n=9) | 100% |
| `sparemal` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `sporing` | 91% (n=11) | 100% | 82% (n=11) | 100% |
| `sporing_mat` | 71% (n=7) | 100% | 57% (n=7) | 100% |
| `spotavtale` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `stromavtale` | 71% (n=7) | 86% | 86% (n=7) | 100% |
| `strommeproblem` | 71% (n=7) | 100% | 71% (n=7) | 100% |
| `svindel_rapport` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `sykepenger` | 100% (n=6) | 100% | 100% (n=6) | 100% |
| `sykmelding` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `takeaway` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `tilbud` | 100% (n=6) | 100% | 100% (n=6) | 100% |
| `tofaktor` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `transaksjonshistorikk` | 100% (n=5) | 100% | 100% (n=5) | 100% |
| `treningsmedlemskap` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `tur_bestilling` | 71% (n=7) | 100% | 71% (n=7) | 100% |
| `utenlandsbetaling` | 100% (n=6) | 100% | 100% (n=6) | 100% |
| `varsler` | 100% (n=7) | 100% | 86% (n=7) | 100% |
| `vedlikeholdsmelding` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `vegetar` | 100% (n=6) | 100% | 100% (n=6) | 100% |
| `vitnemal` | 100% (n=6) | 100% | 33% (n=6) | 100% |

## native_out (gold utelatt) — listelydighet

- 925/926 (99.9%) ble i den tilbudte listen, slik accept-bias krever.
- Utenfor-liste-svar: `igenandel` x1

## custom_in (oppfunnede navn) — generalisering

- fri: 96.2% topp-1, 99.9% i liste.
- enum: 94.4% topp-1, 100.0% i liste.
- Fri-generering-svar som var et innlært taksonominavn utenfor listen: 0/1880 (0.0%).

## Per-domene treffsikkerhet (in-scope, fri generering)

| domene | treff | i liste | N |
|---|---|---|---|
| `bank` | 96.4% | 100.0% | 307 |
| `bolig` | 98.7% | 100.0% | 231 |
| `ehandel` | 97.5% | 99.9% | 707 |
| `forsikring` | 98.5% | 99.6% | 265 |
| `jobb` | 94.9% | 99.6% | 237 |
| `konto` | 95.9% | 100.0% | 268 |
| `matlevering` | 95.7% | 100.0% | 233 |
| `offentlig` | 96.9% | 100.0% | 292 |
| `reise` | 94.4% | 98.5% | 337 |
| `restaurant` | 97.3% | 100.0% | 377 |
| `sosiale_medier` | 97.8% | 100.0% | 180 |
| `strom` | 89.2% | 99.5% | 185 |
| `telekom` | 95.5% | 100.0% | 266 |
| `trening` | 97.7% | 100.0% | 266 |
| `underholdning` | 91.8% | 100.0% | 208 |
| `utdanning` | 95.6% | 98.9% | 182 |

## Per-intent treffsikkerhet (native_in_random, fri mot enum)

| intent | fri treff | fri i liste | enum treff | enum i liste |
|---|---|---|---|---|
| `abonnement_mobil` | 81% (n=16) | 100% | 81% (n=16) | 100% |
| `aldersgrense` | 100% (n=14) | 100% | 64% (n=14) | 100% |
| `allergi` | 86% (n=14) | 100% | 86% (n=14) | 100% |
| `annonser_klage` | 100% (n=16) | 100% | 69% (n=16) | 100% |
| `apningstider` | 100% (n=16) | 100% | 100% (n=16) | 100% |
| `avbestille_reise` | 100% (n=16) | 100% | 100% (n=16) | 100% |
| `avbryt_stromming` | 100% (n=12) | 100% | 100% (n=12) | 100% |
| `avlys_bord` | 100% (n=16) | 100% | 100% (n=16) | 100% |
| `bagasje` | 100% (n=16) | 100% | 100% (n=16) | 100% |
| `beliggenhet` | 94% (n=16) | 100% | 94% (n=16) | 100% |
| `bestillingsstatus` | 100% (n=18) | 100% | 94% (n=18) | 100% |
| `bestillingsstatus_mat` | 93% (n=14) | 100% | 86% (n=14) | 100% |
| `betalingsfeil` | 100% (n=16) | 100% | 100% (n=16) | 100% |
| `betalingsformer` | 93% (n=14) | 100% | 93% (n=14) | 100% |
| `betalingsmetode` | 100% (n=18) | 100% | 94% (n=18) | 100% |
| `bilforsikring` | 100% (n=16) | 100% | 19% (n=16) | 100% |
| `billettrefusjon` | 100% (n=14) | 100% | 57% (n=14) | 100% |
| `blokkert_innhold` | 100% (n=14) | 100% | 71% (n=14) | 100% |
| `book_time` | 86% (n=14) | 100% | 86% (n=14) | 100% |
| `bordbestilling` | 94% (n=16) | 100% | 94% (n=16) | 100% |
| `bytte_leverandor` | 79% (n=14) | 100% | 79% (n=14) | 100% |
| `bytte_selskap` | 100% (n=16) | 100% | 100% (n=16) | 100% |
| `catering` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `data_nedlasting` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `defekt_utstyr` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `defekt_vare` | 100% (n=16) | 100% | 94% (n=16) | 100% |
| `dekning_forsikring` | 100% (n=22) | 100% | 45% (n=22) | 100% |
| `dekning_mobil` | 100% (n=22) | 100% | 100% (n=22) | 100% |
| `depositum` | 93% (n=14) | 100% | 93% (n=14) | 100% |
| `drikkepenger` | 92% (n=12) | 100% | 100% (n=12) | 100% |
| `egenandel` | 93% (n=14) | 93% | 100% (n=14) | 100% |
| `eiendomsvisning` | 100% (n=16) | 100% | 100% (n=16) | 100% |
| `eksamensplan` | 64% (n=14) | 86% | 21% (n=14) | 100% |
| `endre_abonnement` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `endre_epost` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `endre_leiekontrakt` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `faktura` | 100% (n=16) | 100% | 100% (n=16) | 100% |
| `fastlegebytte` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `feil_ordre` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `feil_vare` | 100% (n=16) | 100% | 100% (n=16) | 100% |
| `ferie` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `flybestilling` | 100% (n=16) | 100% | 100% (n=16) | 100% |
| `flystatus` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `flytting` | 100% (n=12) | 100% | 100% (n=12) | 100% |
| `flytting_strom` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `forerkort_fornye` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `fornyelse` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `frakt_kostnad` | 100% (n=18) | 100% | 100% (n=18) | 100% |
| `fravaer` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `frys_medlemskap` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `garanti` | 100% (n=16) | 100% | 100% (n=16) | 100% |
| `gavekort` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `gruppetime` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `hotell` | 100% (n=14) | 100% | 93% (n=14) | 100% |
| `husleie` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `innlogging` | 72% (n=18) | 100% | 78% (n=18) | 100% |
| `innsjekking` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `intervju` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `jobbsoknad` | 93% (n=14) | 100% | 86% (n=14) | 100% |
| `kanseller_bestilling` | 100% (n=20) | 100% | 100% (n=20) | 100% |
| `karakterklage` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `kinobilletter` | 86% (n=14) | 100% | 93% (n=14) | 100% |
| `klage_tele` | 93% (n=14) | 100% | 93% (n=14) | 100% |
| `konsertbillett` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `konto_gjenoppretting` | 86% (n=14) | 100% | 86% (n=14) | 100% |
| `konto_gjenoppretting_sm` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `kortproblemer` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `kurs_pamelding` | 93% (n=14) | 100% | 100% (n=14) | 100% |
| `kursregistrering` | 100% (n=12) | 100% | 100% (n=12) | 100% |
| `lan` | 94% (n=16) | 100% | 81% (n=16) | 100% |
| `lan_og_stipend` | 100% (n=12) | 100% | 25% (n=12) | 100% |
| `legetime` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `leiebil` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `leveringsadresse` | 100% (n=16) | 100% | 94% (n=16) | 100% |
| `leveringstid` | 90% (n=20) | 95% | 95% (n=20) | 100% |
| `lonnssporsmal` | 92% (n=12) | 92% | 92% (n=12) | 100% |
| `manglende_vare` | 92% (n=12) | 100% | 92% (n=12) | 100% |
| `meny` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `miljostrom` | 100% (n=12) | 100% | 92% (n=12) | 100% |
| `mistet_kort` | 100% (n=14) | 100% | 93% (n=14) | 100% |
| `mobildata_bruk` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `mobilskade` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `nabo_klage` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `nummerportering` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `oppsigelse` | 93% (n=14) | 100% | 71% (n=14) | 100% |
| `overforing` | 88% (n=16) | 100% | 75% (n=16) | 100% |
| `pass_fornye` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `passord_reset` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `personlig_trener` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `personvern` | 100% (n=14) | 100% | 93% (n=14) | 100% |
| `produktinformasjon` | 94% (n=18) | 100% | 94% (n=18) | 100% |
| `proveperiode` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `rabatt_mat` | 100% (n=14) | 100% | 86% (n=14) | 100% |
| `rabattkode` | 100% (n=16) | 100% | 100% (n=16) | 100% |
| `refusjon` | 100% (n=24) | 100% | 100% (n=24) | 100% |
| `reiseforsikring` | 79% (n=14) | 79% | 100% (n=14) | 100% |
| `resept_fornye` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `retur` | 100% (n=22) | 100% | 100% (n=22) | 100% |
| `saldo` | 100% (n=16) | 100% | 94% (n=16) | 100% |
| `sjafor_vurdering` | 100% (n=12) | 100% | 100% (n=12) | 100% |
| `skademelding` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `skap` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `skatteoppgjor` | 79% (n=14) | 100% | 93% (n=14) | 100% |
| `skatteutbetaling` | 83% (n=12) | 100% | 83% (n=12) | 100% |
| `slett_konto` | 100% (n=18) | 100% | 100% (n=18) | 100% |
| `sparemal` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `sporing` | 100% (n=22) | 100% | 100% (n=22) | 100% |
| `sporing_mat` | 100% (n=14) | 100% | 86% (n=14) | 100% |
| `spotavtale` | 93% (n=14) | 100% | 100% (n=14) | 100% |
| `stromavtale` | 79% (n=14) | 100% | 79% (n=14) | 100% |
| `strommeproblem` | 64% (n=14) | 100% | 71% (n=14) | 100% |
| `stromregning` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `studentbevis` | 100% (n=14) | 100% | 86% (n=14) | 100% |
| `svindel_rapport` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `sykepenger` | 100% (n=12) | 100% | 100% (n=12) | 100% |
| `sykmelding` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `takeaway` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `tilbud` | 92% (n=12) | 100% | 92% (n=12) | 100% |
| `tofaktor` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `transaksjonshistorikk` | 100% (n=10) | 100% | 90% (n=10) | 100% |
| `treningsmedlemskap` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `tur_bestilling` | 71% (n=14) | 100% | 71% (n=14) | 100% |
| `utenlandsbetaling` | 100% (n=12) | 100% | 75% (n=12) | 100% |
| `varsler` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `vedlikeholdsmelding` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `vegetar` | 100% (n=12) | 100% | 100% (n=12) | 100% |
| `visum` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `vitnemal` | 100% (n=12) | 100% | 33% (n=12) | 100% |

## native_in_random fri generering: full miss-liste

- 3x  innlogging <- passord_reset
- 3x  reiseforsikring <- sykdom på reise
- 3x  abonnement_mobil <- endre_abonnement
- 3x  stromavtale <- spotavtale
- 3x  strommeproblem <- billettrefusjon
- 2x  innlogging <- konto_gjenoppretting
- 2x  tur_bestilling <- flybestilling
- 2x  overforing <- utenlandsbetaling
- 2x  skatteoppgjor <- sykmelding
- 2x  skatteutbetaling <- skatteoppgjor
- 2x  book_time <- personlig_trener
- 2x  eksamensplan <- karakterklage
- 2x  strommeproblem <- kinobilletter
- 2x  tur_bestilling <- leiebil
- 1x  leveringstid <- leveringsadresse
- 1x  konto_gjenoppretting <- endre_epost
- 1x  konto_gjenoppretting <- tofaktor
- 1x  allergi <- meny
- 1x  allergi <- vegetar
- 1x  beliggenhet <- meny
- 1x  lan <- overforing
- 1x  klage_tele <- dekning_mobil
- 1x  bytte_leverandor <- flytting_strom
- 1x  spotavtale <- stromregning
- 1x  skatteoppgjor <- sykepenger
- 1x  tilbud <- bilforsikring
- 1x  egenandel <- igenandel
- 1x  jobbsoknad <- intervju
- 1x  lonnssporsmal <- feil lønn
- 1x  kurs_pamelding <- ferie
- 1x  eksamensplan <- kursregistrering
- 1x  kinobilletter <- billettrefusjon
- 1x  manglende_vare <- feil_ordre
- 1x  drikkepenger <- sjafor_vurdering
- 1x  bytte_leverandor <- miljostrom
- 1x  bytte_leverandor <- stromavtale
- 1x  depositum <- husleie
- 1x  kinobilletter <- aldersgrense
- 1x  bestillingsstatus_mat <- sporing_mat
- 1x  betalingsformer <- gavekort
- 1x  bordbestilling <- avlys_bord
- 1x  produktinformasjon <- defekt_vare
- 1x  eksamensplan <- trekk_from_exams
- 1x  eksamensplan <- trekk_from_eksamen
- 1x  leveringstid <- leveringsdato
- 1x  oppsigelse <- fravaer

## Latens

- exact/free: median 465 ms (N=36)
- exact/enum: median 464 ms (N=36)
- native_in_random/free: median 507 ms (N=1880)
- native_in_random/enum: median 522 ms (N=1880)
- native_in_nearsyn/free: median 519 ms (N=745)
- native_in_nearsyn/enum: median 520 ms (N=745)
- native_out/free: median 522 ms (N=926)
- custom_in/free: median 499 ms (N=1880)
- custom_in/enum: median 521 ms (N=1880)
- snitt output-tokens: 5.8, totalt 57883

## Kvalitetsattest

- Oppgaver totalt: 10008 (72 exact-repetisjoner + 9936 korpusoppgaver).
- Unike kall (ledetekst+modus, utenom exact): 9936/9936 (OK – alle unike). (Enum deler ledetekst med fri per design – ulik dekoding.)
- Unike meldinger: 938. Ordrett i train: 469 (50.0%), ordrett i eval: 68. (Seeds overlapper trening per design; alle utvidede varianter skal ligge utenfor.)
- Nøkkelord i melding (nevner egen gold): 91/940 (9.7%) – naturlig signal på nivå med trening, ingen port.
- Dekning per intensjon: 128 intensjoner, min 54 / maks 132 oppgaver.

## Konklusjon

- **taksonomiens egne navn (gold tilbudt)**: fri generering 96.5% treff / 99.6% i liste; enum 92.1% treff / 100.0% i liste.
- **listeer med nær-synonym-felle**: fri generering 95.4% treff / 99.9% i liste; enum 89.7% treff / 100.0% i liste.
- **oppfunnede/egne intent-navn**: fri generering 96.2% treff / 99.9% i liste; enum 94.4% treff / 100.0% i liste.
- **gold utelatt (skal velge beste treff)**: fri generering 0.0% treff / 99.9% i liste.

Bunnlinje: modellen velger alltid beste treff fra listen (accept-bias) og generaliserer til oppfunnede navn. Svake punkter samler seg rundt nær-synonyme intensjonspar og enkelte domener – se per-domene- og miss-listene over for hvor neste treningsrunde bør sette inn.
