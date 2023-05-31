# Network

```bash
echo 'net.inet.ip.forwarding=1' >> /etc/sysctl.conf
```

## Interfaces

```bash
echo 'inet autoconf' > /etc/hostname.em0 # DHCP Client for WAN
echo 'inet 192.168.1.1 255.255.255.0 192.168.1.255' > /etc/hostname.em1 # Static for LAN
```

## DHCP Server

```bash
rcctl enable dhcpd # DHCP deamon/server
cctl set dhcpd flags em1 
```
**vi** or **nano** */etc/dhcpd.conf* 
```conf
subnet 192.168.1.0 netmask 255.255.255.0 {
	option routers 192.168.1.1;
	option domain-name-servers 192.168.1.1;
	range 192.168.1.10 192.168.1.254;
}
```

## Firewall
**vi** or **nano** */etc/pf.conf* 
```conf
wired = "em1"
table <martians> { 0.0.0.0/8 10.0.0.0/8 127.0.0.0/8 169.254.0.0/16 172.16.0.0/12 192.0.0.0/24 192.0.2.0/24 224.0.0.0/3 192.168.0.0/16 198.18.0.0/15 198.51.100.0/24 203.0.113.0/24 }
set block-policy drop
set loginterface egress
set skip on lo0
match in all scrub (no-df random-id max-mss 1440)
match out on egress inet from !(egress:network) to any nat-to (egress:0)
antispoof quick for { egress $wired }
block in quick on egress from <martians> to any
block return out quick on egress from any to <martians>
block all
pass out quick inet
pass in on { $wired } inet

# Allow HTTP SSH FTP NODEJS to localhost
pass in on egress inet proto tcp from any to (egress) port { 80 443 22 3000 }

# Port forwarding
# pass in on egress inet proto tcp from any to (egress) port { 80 443 } rdr-to 192.168.1.2
```

## DNS

```bash
rcctl enable unbound
```
**vi** or **nano** */var/unbound/etc/unbound.conf* 
```ini
server:
    interface: 192.168.1.1
    interface: 127.0.0.1
    access-control: 192.168.1.0/24 allow
	do-not-query-localhost: no
	hide-identity: yes
	hide-version: yes
	prefetch: yes

forward-zone:
        name: "."
```

**vi** or **nano** */etc/resolv.conf* 
```conf
# add 
nameserver 127.0.0.1
```

# WEB

## Apache

```bash
```

## Nginix

```bash
```

## NodeJS

```bash
```

## MySQL

```bash
```

## PHPMyAdmin

```bash
```

# TODO

- serwer DNS
- serwer NodeJS
- serwer WWW - nginix
- mysql
- firewall
- phpmyadmin
- nano, htop, mc
- FTP/SFTP
- ~~SAMBA~~
- ~~Serwer Poczty (Postfix)~~
- ~~tcpdump~~
- ~~VPN/proxy IPsec OpenVPN~~
- ~~serwer AdAway~~
