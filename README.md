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
echo 'up' >> /etc/hostname.vether0

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

```js
subnet 192.168.2.0 netmask 255.255.255.0 {
	option routers 192.168.2.1;
	option domain-name-servers 192.168.2.1;
	range 192.168.2.10 192.168.2.254;
}
```

## Firewall

**vi** or **nano** _/etc/pf.conf_

```bash
wan = "em0"             # Untrusted
lan = "vether0"         # Trusted

#set block-policy return # Refuse
set block-policy drop # Drop - no response
set loginterface em0
set skip on lo0

## NAT
match in all scrub (no-df random-id max-mss 1440)
match out on em0 inet from !(em0:network) to any nat-to (em0)

pass in quick on $lan all
pass out quick on $lan all

block in log on $wan all

## Open ports
pass in on $wan proto tcp from any to any port { ssh, https, http, ftp, sftp } keep state
pass in on $wan proto udp from any to any port { domain, ntp, http } keep state

## Redirect
pass in on $wan inet proto tcp from any to (em0) port 2222 rdr-to 192.168.2.5 port 22

## PING
pass in on $wan inet proto icmp all icmp-type 8 code 0 keep state
pass out on $wan inet proto icmp all icmp-type 8 code 0 keep state

## Allow UDP/TCP OUT
pass out on $wan proto udp all keep state
pass out on $wan proto tcp all modulate state
```

## DNS

```bash
rcctl enable unbound
```

**vi** or **nano** _/var/unbound/etc/unbound.conf_

```nginx
server:
    interface: 192.168.2.1
    interface: 127.0.0.1
    access-control: 192.168.2.0/24 allow
	do-not-query-localhost: no
	hide-identity: yes
	hide-version: yes
	prefetch: yes

forward-zone:
        name: "."
```

**vi** or **nano** _/etc/resolv.conf_

```bash
# add
nameserver 127.0.0.1
```

# WEB

    pkg_add -u

## Apache

```bash
pkg_add -i apache-httpd
rcctl start apache2
```

![ApacheWorks](img/apache_works.png "Apache Works!")

```bash
rcctl stop apache2
rcctl disable apache2
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
pkg_add php-mysqli php-pdo_mysql php-gd php-intl php-xmlrpc
rcctl enable php74_fpm
rcctl start php74_fpm
cp /etc/php-7.4.sample/* /etc/php-7.4

```

**nano** or **vim** _/etc/nginx/nginx.conf_
_Change_

```nginx
#location ~ \.php$ {
#	try_files      $uri $uri/ =404;
#	fastcgi_pass   unix:run/php-fpm.sock;
#	fastcgi_index  index.php;
#	fastcgi_param  SCRIPT_FILENAME $document_root$fastcgi_script_name;
#	include        fastcgi_params;
#}
```

_TO_

```nginx
location ~ \.php$ {
	try_files      $uri $uri/ =404;
	fastcgi_pass   unix:run/php-fpm.sock;
	fastcgi_index  index.php;
	fastcgi_param  SCRIPT_FILENAME $document_root$fastcgi_script_name;
	include        fastcgi_params;
}
```

_Test nginix config_

```bash
	nginx -t
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
