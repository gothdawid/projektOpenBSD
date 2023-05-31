# Network

```bash
echo 'net.inet.ip.forwarding=1' >> /etc/sysctl.conf
```

## Interfaces

```bash
echo 'inet autoconf' > /etc/hostname.em0 # DHCP Client for WAN
echo 'up media autoselect' > /etc/hostname.em1
echo 'up media autoselect' > /etc/hostname.em2
echo 'up media autoselect' > /etc/hostname.em3

echo 'inet 192.168.2.1 255.255.255.0 192.168.2.255' > /etc/hostname.vether0 # Static for LAN
echo 'add em3' > /etc/hostname.bridge0
echo 'add em2' >> /etc/hostname.bridge0
echo 'add em1' >> /etc/hostname.bridge0
echo 'add vether0 ' >> /etc/hostname.bridge0
echo 'up' >> /etc/hostname.bridge0
reboot
```

## DHCP Server

```bash
rcctl enable dhcpd # DHCP deamon/server
rcctl set dhcpd flags vether0
```

**vi** or **nano** _/etc/dhcpd.conf_

```conf
subnet 192.168.1.0 netmask 255.255.255.0 {
	option routers 192.168.1.1;
	option domain-name-servers 192.168.1.1;
	range 192.168.1.10 192.168.1.254;
}
```

## Firewall

**vi** or **nano** _/etc/pf.conf_

```conf
wired = "bridge0"
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

**vi** or **nano** _/var/unbound/etc/unbound.conf_

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

**vi** or **nano** _/etc/resolv.conf_

```conf
# add
nameserver 127.0.0.1
```

# WEB

    pkg_add -u

## Apache

```bash
pkg_add -i apache-httpd
rcctl enable apache2
rcctl stop apache2
```

## Nginix

```bash
pkg_add nginx
rcctl enable nginx
rcctl start nginx
```

## PHP

```bash
pkg_add php
# Select PHP version
pkg_add php-mysqli php-pdo_mysql
pkg_add php-gd php-intl php-xmlrpc
rcctl enable php74_fpm
rcctl start php74_fpm
cp /etc/php-7.4.sample/* /etc/php-7.4

```

**nano** or **vim** _/etc/nginx/nginx.conf_

```bash

```

Test nginix
nginx -t

**nano** or **vim** \* _/etc/php-fpm.conf_

```

```

## MySQL

```bash
pkg_info -Q mysql
pkg_add -V mariadb-server
pkg_add -v mariadb-client
 rcctl enable mysqld
mysql_install_db
rcctl start mysqld
rcctl stop mysqld
rcctl restart mysqld
cctl check mysqld
mysql_secure_installation
# confirm all
```

## NodeJS

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
