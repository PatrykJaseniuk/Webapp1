# Opis

To jest system elementów komunikujących się przez IP (Protokół Internetowy). Kod zawarty w tym repo zawiera definicję elementów systemu. Działający system będzie składał się z jednej instancji **DataBase** i wielu **App**. **App** może komunikować się wyłącznie z **Database**, nie mogą komunikować się między sobą. Komunikacja **DataBase**<-->**App** będzie odbywać się przez API, które ma zaimplementowane takie elementy jak:
- pełen typowanie(zdefiniowany język/protokół komunikacji z **Database**, dla servera językowego. Wykorzystywane podczas pisanai kodu)
- autentyfikacja **DataBase** komunikuje sie z wieloma **App** jednocześnie przez jeden kanał komunikacji - IP. Autentyfikacja umożliwia przyporządkowanie poszczególnych wiadomości, które przychodzą przez IP do ich nadawców. Dzięki temu możliwa jest bezpośrednia komunikacja pojedynczej instancji **App** z **Database**.


