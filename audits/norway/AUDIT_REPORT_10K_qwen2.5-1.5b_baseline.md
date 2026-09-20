# Norsk modellrevisjon — `qwen2.5:1.5b`

- 10008 reelle API-kall, temperatur 0, `no/output/results_no_10k_base_v2desc.csv`
- Korpus: 940 caser, 128 intensjoner, 16 domener, 12 exact-prober

## Sammendragstabell

| variant | modus | N | topp-1 treff | i liste | truffet | median ms |
|---|---|---|---|---|---|---|
| exact | free | 36 | 97.2% | 97.2% | 97.2% | 345 |
| exact | enum | 36 | 83.3% | 100.0% | 100.0% | 335 |
| native_in_random | free | 1880 | 88.8% | 98.4% | 98.4% | 353 |
| native_in_random | enum | 1880 | 90.2% | 100.0% | 100.0% | 360 |
| native_in_nearsyn | free | 745 | 85.6% | 98.3% | 98.3% | 358 |
| native_in_nearsyn | enum | 745 | 86.2% | 100.0% | 100.0% | 360 |
| native_out | free | 926 | 0.0% | 97.3% | 97.3% | 360 |
| custom_in | free | 1880 | 77.1% | 99.1% | 99.1% | 350 |
| custom_in | enum | 1880 | 79.1% | 100.0% | 100.0% | 362 |

## Porter (gates)

- exact free = 100: 97.2% → **IKKE BESTÅTT**
- inscope >= 94: 84.2% → **IKKE BESTÅTT**
- nearsyn free >= 94: 85.6% → **IKKE BESTÅTT**
- custom free >= 88: 77.1% → **IKKE BESTÅTT**
- in-list = 100: 99.1% → **IKKE BESTÅTT**

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
| `refusjon` P1 | free | ['refusjon', 'refusjon', 'refusjon'] | ja | 3/3 | 3/3 |
| `refusjon` P1 | enum | ['refusjon', 'refusjon', 'refusjon'] | ja | 3/3 | 3/3 |
| `sporing` P2 | free | ['sporing', 'sporing', 'sporing'] | ja | 3/3 | 3/3 |
| `sporing` P2 | enum | ['sporing', 'sporing', 'sporing'] | ja | 3/3 | 3/3 |
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
| `billettrefusjon` P8 | enum | ['konsertbillett', 'konsertbillett', 'konsertbillett'] | ja | 0/3 | 3/3 |
| `konto_gjenoppretting` P9 | free | ['konto_gjenoppretting', 'konto_gjenoppretting', 'konto_gjenoppretting'] | ja | 3/3 | 3/3 |
| `konto_gjenoppretting` P9 | enum | ['konto_gjenoppretting', 'konto_gjenoppretting', 'konto_gjenoppretting'] | ja | 3/3 | 3/3 |
| `sporing_mat` P10 | free | ['sporing_mat', 'sporing_mat', 'sporing_mat'] | ja | 3/3 | 3/3 |
| `sporing_mat` P10 | enum | ['bestillingsstatus_mat', 'bestillingsstatus_mat', 'bestillingsstatus_mat'] | ja | 0/3 | 3/3 |
| `fravaer` P11 | free | ['fraviaer', 'fravaer', 'fravaer'] | NEI | 2/3 | 2/3 |
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

- fri: 85.6% topp-1, 98.3% i liste.
- enum: 86.2% topp-1, 100.0% i liste.

Feil i fri generering (gold → valgt): `gruppetime`→`book_time` x5, `refusjon`→`kanseller_bestilling` x4, `abonnement_mobil`→`endre_abonnement` x3, `personlig_trener`→`book_time` x3, `oppsigelse`→`jobbsoknad` x3, `eksamensplan`→`kursregistrering` x3, `sporing`→`bestillingsstatus` x2, `leveringstid`→`bestillingsstatus` x2, `defekt_vare`→`feil_vare` x2, `flybestilling`→`avbestille_reise` x2, `bytte_leverandor`→`stromavtale` x2, `spotavtale`→`stromregning` x2, `sporing_mat`→`sjafor_vurdering` x2, `sporing_mat`→`bestillingsstatus_mat` x2, `utenlandsbetaling`→`landsbetaling` x2

| gold | fri treff | fri i liste | enum treff | enum i liste |
|---|---|---|---|---|
| `abonnement_mobil` | 62% (n=8) | 100% | 62% (n=8) | 100% |
| `aldersgrense` | 86% (n=7) | 86% | 71% (n=7) | 100% |
| `allergi` | 71% (n=7) | 100% | 71% (n=7) | 100% |
| `annonser_klage` | 100% (n=8) | 100% | 100% (n=8) | 100% |
| `avbestille_reise` | 88% (n=8) | 100% | 100% (n=8) | 100% |
| `avbryt_stromming` | 100% (n=6) | 100% | 100% (n=6) | 100% |
| `avlys_bord` | 88% (n=8) | 100% | 88% (n=8) | 100% |
| `bagasje` | 88% (n=8) | 100% | 100% (n=8) | 100% |
| `bestillingsstatus` | 78% (n=9) | 100% | 78% (n=9) | 100% |
| `bestillingsstatus_mat` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `betalingsmetode` | 100% (n=9) | 100% | 100% (n=9) | 100% |
| `billettrefusjon` | 86% (n=7) | 100% | 43% (n=7) | 100% |
| `blokkert_innhold` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `book_time` | 71% (n=7) | 100% | 86% (n=7) | 100% |
| `bordbestilling` | 100% (n=8) | 100% | 100% (n=8) | 100% |
| `bytte_leverandor` | 71% (n=7) | 100% | 71% (n=7) | 100% |
| `bytte_selskap` | 100% (n=8) | 100% | 88% (n=8) | 100% |
| `catering` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `data_nedlasting` | 86% (n=7) | 100% | 100% (n=7) | 100% |
| `defekt_vare` | 50% (n=8) | 100% | 62% (n=8) | 100% |
| `dekning_forsikring` | 100% (n=11) | 100% | 100% (n=11) | 100% |
| `dekning_mobil` | 100% (n=11) | 100% | 100% (n=11) | 100% |
| `depositum` | 100% (n=7) | 100% | 86% (n=7) | 100% |
| `drikkepenger` | 100% (n=6) | 100% | 83% (n=6) | 100% |
| `egenandel` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `eksamensplan` | 43% (n=7) | 100% | 29% (n=7) | 100% |
| `endre_abonnement` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `endre_epost` | 86% (n=7) | 86% | 100% (n=7) | 100% |
| `endre_leiekontrakt` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `fastlegebytte` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `feil_ordre` | 100% (n=7) | 100% | 86% (n=7) | 100% |
| `feil_vare` | 88% (n=8) | 100% | 88% (n=8) | 100% |
| `ferie` | 86% (n=7) | 86% | 100% (n=7) | 100% |
| `flybestilling` | 75% (n=8) | 100% | 100% (n=8) | 100% |
| `flystatus` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `forerkort_fornye` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `fornyelse` | 86% (n=7) | 100% | 86% (n=7) | 100% |
| `frakt_kostnad` | 78% (n=9) | 89% | 100% (n=9) | 100% |
| `fravaer` | 71% (n=7) | 86% | 71% (n=7) | 100% |
| `frys_medlemskap` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `gavekort` | 100% (n=7) | 100% | 86% (n=7) | 100% |
| `gruppetime` | 29% (n=7) | 100% | 29% (n=7) | 100% |
| `husleie` | 86% (n=7) | 100% | 86% (n=7) | 100% |
| `innlogging` | 78% (n=9) | 89% | 89% (n=9) | 100% |
| `innsjekking` | 71% (n=7) | 100% | 86% (n=7) | 100% |
| `intervju` | 86% (n=7) | 100% | 29% (n=7) | 100% |
| `jobbsoknad` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `kanseller_bestilling` | 100% (n=10) | 100% | 100% (n=10) | 100% |
| `karakterklage` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `kinobilletter` | 86% (n=7) | 100% | 57% (n=7) | 100% |
| `klage_tele` | 86% (n=7) | 100% | 100% (n=7) | 100% |
| `konsertbillett` | 71% (n=7) | 100% | 100% (n=7) | 100% |
| `konto_gjenoppretting` | 71% (n=7) | 86% | 71% (n=7) | 100% |
| `konto_gjenoppretting_sm` | 71% (n=7) | 100% | 86% (n=7) | 100% |
| `kortproblemer` | 71% (n=7) | 100% | 100% (n=7) | 100% |
| `kurs_pamelding` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `kursregistrering` | 100% (n=6) | 100% | 100% (n=6) | 100% |
| `legetime` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `leveringstid` | 70% (n=10) | 90% | 90% (n=10) | 100% |
| `manglende_vare` | 100% (n=6) | 100% | 100% (n=6) | 100% |
| `meny` | 100% (n=7) | 100% | 86% (n=7) | 100% |
| `mistet_kort` | 100% (n=7) | 100% | 71% (n=7) | 100% |
| `mobildata_bruk` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `nabo_klage` | 86% (n=7) | 100% | 86% (n=7) | 100% |
| `nummerportering` | 86% (n=7) | 100% | 100% (n=7) | 100% |
| `oppsigelse` | 57% (n=7) | 100% | 57% (n=7) | 100% |
| `overforing` | 100% (n=8) | 100% | 100% (n=8) | 100% |
| `pass_fornye` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `passord_reset` | 86% (n=7) | 86% | 100% (n=7) | 100% |
| `personlig_trener` | 57% (n=7) | 100% | 43% (n=7) | 100% |
| `personvern` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `proveperiode` | 86% (n=7) | 100% | 86% (n=7) | 100% |
| `rabatt_mat` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `rabattkode` | 100% (n=8) | 100% | 100% (n=8) | 100% |
| `refusjon` | 67% (n=12) | 100% | 58% (n=12) | 100% |
| `resept_fornye` | 86% (n=7) | 86% | 100% (n=7) | 100% |
| `retur` | 91% (n=11) | 100% | 91% (n=11) | 100% |
| `saldo` | 88% (n=8) | 100% | 100% (n=8) | 100% |
| `sjafor_vurdering` | 100% (n=6) | 100% | 100% (n=6) | 100% |
| `skademelding` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `slett_konto` | 78% (n=9) | 89% | 89% (n=9) | 100% |
| `sparemal` | 86% (n=7) | 100% | 86% (n=7) | 100% |
| `sporing` | 64% (n=11) | 100% | 45% (n=11) | 100% |
| `sporing_mat` | 43% (n=7) | 100% | 43% (n=7) | 100% |
| `spotavtale` | 57% (n=7) | 100% | 86% (n=7) | 100% |
| `stromavtale` | 71% (n=7) | 100% | 71% (n=7) | 100% |
| `strommeproblem` | 57% (n=7) | 100% | 57% (n=7) | 100% |
| `svindel_rapport` | 100% (n=7) | 100% | 86% (n=7) | 100% |
| `sykepenger` | 100% (n=6) | 100% | 100% (n=6) | 100% |
| `sykmelding` | 86% (n=7) | 100% | 86% (n=7) | 100% |
| `takeaway` | 86% (n=7) | 100% | 86% (n=7) | 100% |
| `tilbud` | 83% (n=6) | 100% | 83% (n=6) | 100% |
| `tofaktor` | 86% (n=7) | 100% | 86% (n=7) | 100% |
| `transaksjonshistorikk` | 100% (n=5) | 100% | 100% (n=5) | 100% |
| `treningsmedlemskap` | 86% (n=7) | 100% | 71% (n=7) | 100% |
| `tur_bestilling` | 86% (n=7) | 100% | 86% (n=7) | 100% |
| `utenlandsbetaling` | 50% (n=6) | 67% | 50% (n=6) | 100% |
| `varsler` | 100% (n=7) | 100% | 100% (n=7) | 100% |
| `vedlikeholdsmelding` | 71% (n=7) | 100% | 86% (n=7) | 100% |
| `vegetar` | 100% (n=6) | 100% | 100% (n=6) | 100% |
| `vitnemal` | 83% (n=6) | 100% | 83% (n=6) | 100% |

## native_out (gold utelatt) — listelydighet

- 901/926 (97.3%) ble i den tilbudte listen, slik accept-bias krever.
- Utenfor-liste-svar: `opening_hours` x4, `endre_passord` x2, `password_reset` x2, `bestilling` x1, `cancel_reservation` x1, `catering_bride` x1, `bestilling av catering for kontorfesten` x1, `mobilabonnement` x1, `spotpris: brukeren vil ha informasjon om den nylige spotprisen for energiene de har kørt eller planlagt å køre` x1, `apoteker_resep_fornye` x1, `vis_leilighet_fredag` x1, `sykmelding` x1, `kursbegivelse` x1, `book_ticket` x1, `konsertbillett` x1

## custom_in (oppfunnede navn) — generalisering

- fri: 77.1% topp-1, 99.1% i liste.
- enum: 79.1% topp-1, 100.0% i liste.
- Fri-generering-svar som var et innlært taksonominavn utenfor listen: 0/1880 (0.0%).

## Per-domene treffsikkerhet (in-scope, fri generering)

| domene | treff | i liste | N |
|---|---|---|---|
| `bank` | 88.3% | 99.3% | 307 |
| `bolig` | 87.4% | 100.0% | 231 |
| `ehandel` | 82.3% | 98.2% | 707 |
| `forsikring` | 86.4% | 100.0% | 265 |
| `jobb` | 83.5% | 97.5% | 237 |
| `konto` | 81.0% | 94.4% | 268 |
| `matlevering` | 80.7% | 99.6% | 233 |
| `offentlig` | 86.6% | 99.0% | 292 |
| `reise` | 85.2% | 100.0% | 337 |
| `restaurant` | 84.6% | 98.7% | 377 |
| `sosiale_medier` | 89.4% | 100.0% | 180 |
| `strom` | 74.6% | 99.5% | 185 |
| `telekom` | 80.1% | 97.0% | 266 |
| `trening` | 79.3% | 99.2% | 266 |
| `underholdning` | 80.3% | 98.1% | 208 |
| `utdanning` | 86.3% | 98.9% | 182 |

## Per-intent treffsikkerhet (native_in_random, fri mot enum)

| intent | fri treff | fri i liste | enum treff | enum i liste |
|---|---|---|---|---|
| `abonnement_mobil` | 75% (n=16) | 100% | 62% (n=16) | 100% |
| `aldersgrense` | 100% (n=14) | 100% | 93% (n=14) | 100% |
| `allergi` | 93% (n=14) | 93% | 86% (n=14) | 100% |
| `annonser_klage` | 100% (n=16) | 100% | 94% (n=16) | 100% |
| `apningstider` | 100% (n=16) | 100% | 100% (n=16) | 100% |
| `avbestille_reise` | 100% (n=16) | 100% | 100% (n=16) | 100% |
| `avbryt_stromming` | 100% (n=12) | 100% | 100% (n=12) | 100% |
| `avlys_bord` | 88% (n=16) | 100% | 100% (n=16) | 100% |
| `bagasje` | 94% (n=16) | 100% | 100% (n=16) | 100% |
| `beliggenhet` | 81% (n=16) | 100% | 94% (n=16) | 100% |
| `bestillingsstatus` | 89% (n=18) | 100% | 94% (n=18) | 100% |
| `bestillingsstatus_mat` | 93% (n=14) | 100% | 100% (n=14) | 100% |
| `betalingsfeil` | 100% (n=16) | 100% | 100% (n=16) | 100% |
| `betalingsformer` | 79% (n=14) | 86% | 79% (n=14) | 100% |
| `betalingsmetode` | 89% (n=18) | 94% | 94% (n=18) | 100% |
| `bilforsikring` | 81% (n=16) | 100% | 25% (n=16) | 100% |
| `billettrefusjon` | 93% (n=14) | 100% | 86% (n=14) | 100% |
| `blokkert_innhold` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `book_time` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `bordbestilling` | 100% (n=16) | 100% | 100% (n=16) | 100% |
| `bytte_leverandor` | 79% (n=14) | 100% | 79% (n=14) | 100% |
| `bytte_selskap` | 100% (n=16) | 100% | 94% (n=16) | 100% |
| `catering` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `data_nedlasting` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `defekt_utstyr` | 86% (n=14) | 100% | 93% (n=14) | 100% |
| `defekt_vare` | 81% (n=16) | 100% | 81% (n=16) | 100% |
| `dekning_forsikring` | 100% (n=22) | 100% | 95% (n=22) | 100% |
| `dekning_mobil` | 100% (n=22) | 100% | 100% (n=22) | 100% |
| `depositum` | 93% (n=14) | 100% | 93% (n=14) | 100% |
| `drikkepenger` | 92% (n=12) | 100% | 100% (n=12) | 100% |
| `egenandel` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `eiendomsvisning` | 100% (n=16) | 100% | 100% (n=16) | 100% |
| `eksamensplan` | 71% (n=14) | 93% | 57% (n=14) | 100% |
| `endre_abonnement` | 100% (n=14) | 100% | 93% (n=14) | 100% |
| `endre_epost` | 100% (n=14) | 100% | 93% (n=14) | 100% |
| `endre_leiekontrakt` | 93% (n=14) | 100% | 93% (n=14) | 100% |
| `faktura` | 94% (n=16) | 100% | 88% (n=16) | 100% |
| `fastlegebytte` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `feil_ordre` | 79% (n=14) | 100% | 79% (n=14) | 100% |
| `feil_vare` | 94% (n=16) | 100% | 94% (n=16) | 100% |
| `ferie` | 100% (n=14) | 100% | 86% (n=14) | 100% |
| `flybestilling` | 94% (n=16) | 100% | 94% (n=16) | 100% |
| `flystatus` | 93% (n=14) | 100% | 100% (n=14) | 100% |
| `flytting` | 100% (n=12) | 100% | 100% (n=12) | 100% |
| `flytting_strom` | 93% (n=14) | 93% | 100% (n=14) | 100% |
| `forerkort_fornye` | 100% (n=14) | 100% | 93% (n=14) | 100% |
| `fornyelse` | 86% (n=14) | 100% | 100% (n=14) | 100% |
| `frakt_kostnad` | 100% (n=18) | 100% | 100% (n=18) | 100% |
| `fravaer` | 79% (n=14) | 93% | 93% (n=14) | 100% |
| `frys_medlemskap` | 79% (n=14) | 100% | 100% (n=14) | 100% |
| `garanti` | 100% (n=16) | 100% | 100% (n=16) | 100% |
| `gavekort` | 93% (n=14) | 93% | 79% (n=14) | 100% |
| `gruppetime` | 50% (n=14) | 86% | 57% (n=14) | 100% |
| `hotell` | 71% (n=14) | 100% | 64% (n=14) | 100% |
| `husleie` | 93% (n=14) | 100% | 100% (n=14) | 100% |
| `innlogging` | 72% (n=18) | 83% | 72% (n=18) | 100% |
| `innsjekking` | 93% (n=14) | 100% | 86% (n=14) | 100% |
| `intervju` | 86% (n=14) | 100% | 79% (n=14) | 100% |
| `jobbsoknad` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `kanseller_bestilling` | 100% (n=20) | 100% | 100% (n=20) | 100% |
| `karakterklage` | 93% (n=14) | 93% | 100% (n=14) | 100% |
| `kinobilletter` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `klage_tele` | 79% (n=14) | 93% | 93% (n=14) | 100% |
| `konsertbillett` | 100% (n=14) | 100% | 93% (n=14) | 100% |
| `konto_gjenoppretting` | 64% (n=14) | 93% | 79% (n=14) | 100% |
| `konto_gjenoppretting_sm` | 93% (n=14) | 100% | 100% (n=14) | 100% |
| `kortproblemer` | 93% (n=14) | 100% | 100% (n=14) | 100% |
| `kurs_pamelding` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `kursregistrering` | 100% (n=12) | 100% | 100% (n=12) | 100% |
| `lan` | 81% (n=16) | 100% | 81% (n=16) | 100% |
| `lan_og_stipend` | 100% (n=12) | 100% | 83% (n=12) | 100% |
| `legetime` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `leiebil` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `leveringsadresse` | 100% (n=16) | 100% | 100% (n=16) | 100% |
| `leveringstid` | 40% (n=20) | 70% | 80% (n=20) | 100% |
| `lonnssporsmal` | 50% (n=12) | 92% | 92% (n=12) | 100% |
| `manglende_vare` | 100% (n=12) | 100% | 100% (n=12) | 100% |
| `meny` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `miljostrom` | 75% (n=12) | 100% | 83% (n=12) | 100% |
| `mistet_kort` | 79% (n=14) | 100% | 79% (n=14) | 100% |
| `mobildata_bruk` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `mobilskade` | 50% (n=14) | 100% | 64% (n=14) | 100% |
| `nabo_klage` | 100% (n=14) | 100% | 93% (n=14) | 100% |
| `nummerportering` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `oppsigelse` | 79% (n=14) | 100% | 71% (n=14) | 100% |
| `overforing` | 100% (n=16) | 100% | 94% (n=16) | 100% |
| `pass_fornye` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `passord_reset` | 79% (n=14) | 86% | 100% (n=14) | 100% |
| `personlig_trener` | 71% (n=14) | 100% | 71% (n=14) | 100% |
| `personvern` | 93% (n=14) | 100% | 86% (n=14) | 100% |
| `produktinformasjon` | 56% (n=18) | 100% | 83% (n=18) | 100% |
| `proveperiode` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `rabatt_mat` | 93% (n=14) | 100% | 100% (n=14) | 100% |
| `rabattkode` | 94% (n=16) | 94% | 100% (n=16) | 100% |
| `refusjon` | 88% (n=24) | 100% | 75% (n=24) | 100% |
| `reiseforsikring` | 93% (n=14) | 100% | 93% (n=14) | 100% |
| `resept_fornye` | 93% (n=14) | 100% | 100% (n=14) | 100% |
| `retur` | 100% (n=22) | 100% | 100% (n=22) | 100% |
| `saldo` | 94% (n=16) | 100% | 94% (n=16) | 100% |
| `sjafor_vurdering` | 75% (n=12) | 100% | 83% (n=12) | 100% |
| `skademelding` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `skap` | 93% (n=14) | 100% | 100% (n=14) | 100% |
| `skatteoppgjor` | 64% (n=14) | 100% | 86% (n=14) | 100% |
| `skatteutbetaling` | 92% (n=12) | 100% | 92% (n=12) | 100% |
| `slett_konto` | 83% (n=18) | 89% | 89% (n=18) | 100% |
| `sparemal` | 100% (n=14) | 100% | 93% (n=14) | 100% |
| `sporing` | 77% (n=22) | 95% | 73% (n=22) | 100% |
| `sporing_mat` | 43% (n=14) | 100% | 50% (n=14) | 100% |
| `spotavtale` | 50% (n=14) | 100% | 71% (n=14) | 100% |
| `stromavtale` | 93% (n=14) | 100% | 86% (n=14) | 100% |
| `strommeproblem` | 71% (n=14) | 93% | 71% (n=14) | 100% |
| `stromregning` | 93% (n=14) | 100% | 93% (n=14) | 100% |
| `studentbevis` | 86% (n=14) | 100% | 93% (n=14) | 100% |
| `svindel_rapport` | 100% (n=14) | 100% | 86% (n=14) | 100% |
| `sykepenger` | 100% (n=12) | 100% | 100% (n=12) | 100% |
| `sykmelding` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `takeaway` | 86% (n=14) | 100% | 100% (n=14) | 100% |
| `tilbud` | 83% (n=12) | 100% | 83% (n=12) | 100% |
| `tofaktor` | 100% (n=14) | 100% | 93% (n=14) | 100% |
| `transaksjonshistorikk` | 80% (n=10) | 100% | 90% (n=10) | 100% |
| `treningsmedlemskap` | 64% (n=14) | 100% | 50% (n=14) | 100% |
| `tur_bestilling` | 93% (n=14) | 100% | 86% (n=14) | 100% |
| `utenlandsbetaling` | 83% (n=12) | 100% | 92% (n=12) | 100% |
| `varsler` | 100% (n=14) | 100% | 86% (n=14) | 100% |
| `vedlikeholdsmelding` | 64% (n=14) | 100% | 86% (n=14) | 100% |
| `vegetar` | 92% (n=12) | 92% | 100% (n=12) | 100% |
| `visum` | 100% (n=14) | 100% | 100% (n=14) | 100% |
| `vitnemal` | 83% (n=12) | 100% | 100% (n=12) | 100% |

## native_in_random fri generering: full miss-liste

- 5x  leveringstid <- leverstid
- 5x  spotavtale <- stromavtale
- 5x  sporing_mat <- bestillingsstatus_mat
- 4x  abonnement_mobil <- endre_abonnement
- 4x  skatteoppgjor <- sykmelding
- 4x  personlig_trener <- book_time
- 3x  sporing <- leveringstid
- 3x  innlogging <- password_reset
- 3x  hotell <- avbestille_reise
- 3x  bytte_leverandor <- stromavtale
- 3x  treningsmedlemskap <- proveperiode
- 3x  frys_medlemskap <- treningsmedlemskap
- 3x  gruppetime <- book_time
- 3x  strommeproblem <- billettrefusjon
- 3x  sjafor_vurdering <- drikkepenger
- 2x  refusjon <- kanseller_bestilling
- 2x  produktinformasjon <- defekt_vare
- 2x  produktinformasjon <- leveringsadresse
- 2x  leveringstid <- kanseller_bestilling
- 2x  leveringstid <- bestillingsstatus
- 2x  leveringstid <- leveringsadresse
- 2x  defekt_vare <- feil_vare
- 2x  innlogging <- passord_reset
- 2x  passord_reset <- password_reset
- 2x  takeaway <- bordbestilling
- 2x  mistet_kort <- kortproblemer
- 2x  utenlandsbetaling <- overforing
- 2x  mobilskade <- nummerportering
- 2x  mobilskade <- klage_tele
- 2x  vedlikeholdsmelding <- nabo_klage
- 2x  gruppetime <- grouptime
- 2x  fornyelse <- bytte_selskap
- 2x  bilforsikring <- dekning_forsikring
- 2x  intervju <- jobbsoknad
- 2x  oppsigelse <- jobbsoknad
- 2x  eksamensplan <- kursregistrering
- 2x  vitnemal <- lan_og_stipend
- 2x  feil_ordre <- drikkepenger
- 2x  sporing_mat <- sjafor_vurdering
- 1x  refusjon <- betalingsfeil
- 1x  bestillingsstatus <- betalingsfeil
- 1x  produktinformasjon <- leveringstid
- 1x  produktinformasjon <- frakt_kostnad
- 1x  produktinformasjon <- bestillingsstatus
- 1x  rabattkode <- rabbattkode
- 1x  feil_vare <- betalingsmetode
- 1x  betalingsmetode <- betaling_måte
- 1x  betalingsmetode <- kanseller_bestilling
- 1x  passord_reset <- innlogging
- 1x  slett_konto <- passord_reset
- 1x  slett_konto <- konto_slett
- 1x  slett_konto <- endre_konto
- 1x  konto_gjenoppretting <- slett_konto
- 1x  konto_gjenoppretting <- innlogging
- 1x  konto_gjenoppretting <- endre_epost
- 1x  konto_gjenoppretting <- password_reset
- 1x  avlys_bord <- catering
- 1x  allergi <- allergy
- 1x  beliggenhet <- gavekort
- 1x  beliggenhet <- meny

## Latens

- exact/free: median 345 ms (N=36)
- exact/enum: median 335 ms (N=36)
- native_in_random/free: median 353 ms (N=1880)
- native_in_random/enum: median 360 ms (N=1880)
- native_in_nearsyn/free: median 358 ms (N=745)
- native_in_nearsyn/enum: median 360 ms (N=745)
- native_out/free: median 360 ms (N=926)
- custom_in/free: median 350 ms (N=1880)
- custom_in/enum: median 362 ms (N=1880)
- snitt output-tokens: 5.8, totalt 58066

## Kvalitetsattest

- Oppgaver totalt: 10008 (72 exact-repetisjoner + 9936 korpusoppgaver).
- Unike kall (ledetekst+modus, utenom exact): 9936/9936 (OK – alle unike). (Enum deler ledetekst med fri per design – ulik dekoding.)
- Unike meldinger: 938. Ordrett i train: 469 (50.0%), ordrett i eval: 68. (Seeds overlapper trening per design; alle utvidede varianter skal ligge utenfor.)
- Nøkkelord i melding (nevner egen gold): 91/940 (9.7%) – naturlig signal på nivå med trening, ingen port.
- Dekning per intensjon: 128 intensjoner, min 54 / maks 132 oppgaver.

## Konklusjon

- **taksonomiens egne navn (gold tilbudt)**: fri generering 88.8% treff / 98.4% i liste; enum 90.2% treff / 100.0% i liste.
- **listeer med nær-synonym-felle**: fri generering 85.6% treff / 98.3% i liste; enum 86.2% treff / 100.0% i liste.
- **oppfunnede/egne intent-navn**: fri generering 77.1% treff / 99.1% i liste; enum 79.1% treff / 100.0% i liste.
- **gold utelatt (skal velge beste treff)**: fri generering 0.0% treff / 97.3% i liste.

Bunnlinje: modellen velger alltid beste treff fra listen (accept-bias) og generaliserer til oppfunnede navn. Svake punkter samler seg rundt nær-synonyme intensjonspar og enkelte domener – se per-domene- og miss-listene over for hvor neste treningsrunde bør sette inn.
