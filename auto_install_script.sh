#!/bin/bash

# Packages
pkg upgrade -y
pkg install -y php56 mc nano htop

# Network
echo 'net.inet.ip.forwarding=1' >> /etc/sysctl.conf

## Interfaces
echo 'inet autoconf' > /etc/hostname.em0 # DHCP Client for WAN
echo 'up media autoselect' > /etc/hostname.em1
echo 'up media autoselect' > /etc/hostname.em2
echo 'up media autoselect' > /etc/hostname.em3

echo 'inet 192.168.2.1 255.255.255.0 192.168.2.255' > /etc/hostname.vether0 # Static for LAN
echo 'up' >> /etc/hostname.vether0

echo 'add em3' > /etc/hostname.bridge0
echo 'add em2' >> /etc/hostname.bridge0
echo 'add em1' >> /etc/hostname.bridge0
echo 'add vether0' >> /etc/hostname.bridge0
echo 'up' >> /etc/hostname.bridge0

# reboot

# DHCP Server
sysrc dhcpd_enable=YES
sysrc dhcpd_flags=vether0

# Configure DHCP Server
cat << EOF > /etc/dhcpd.conf
subnet 192.168.2.0 netmask 255.255.255.0 {
	option routers 192.168.2.1;
	option domain-name-servers 192.168.2.1;
	range 192.168.2.10 192.168.2.254;
}
EOF

# Firewall
cat << EOF > /etc/pf.conf
wan = "em0"             # Untrusted
lan = "vether0"         # Trusted

#set block-policy return # Refuse
set block-policy drop # Drop - no response
set loginterface em0
set skip on lo0

## NAT
match in all scrub (no-df random-id max-mss 1440)
match out on em0 inet from !(em0:network) to any nat-to (em0)

pass in quick on \$lan all
pass out quick on \$lan all

block in log on \$wan all

## Open ports
pass in on \$wan proto tcp from any to any port { domain, ntp, ssh, https, http, ftp, sftp, 3000  } keep state
pass in on \$wan proto udp from any to any port { domain, ntp, http, 3000 } keep state

## Redirect
pass in on \$wan inet proto tcp from any to (em0) port 2222 rdr-to 192.168.2.5 port 22

## PING
pass in on \$wan inet proto icmp all icmp-type 8 code 0 keep state
pass out on \$wan inet proto icmp all icmp-type 8 code 0 keep state

## Allow UDP/TCP OUT
pass out on \$wan proto udp all keep state
pass out on \$wan proto tcp all modulate state
EOF

# DNS
rcctl enable unbound

cat << EOF > /var/unbound/etc/unbound.conf
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
EOF

echo "search egzample.local" > /etc/resolv.conf
echo "nameserver 127.0.0.1" >> /etc/resolv.conf
echo "lookup file bind" >> /etc/resolv.conf

# WEB

## Apache
pkg install -y apache24
service apache24 start
service apache24 stop

## Nginx
pkg install -y nginx
sysrc nginx_enable=YES
service nginx start

## PHP
pkg install -y php80 php80-mysqli php80-pdo_mysql php80-gd php80-intl php80-xmlrpc
sysrc php_fpm_enable=YES
service php-fpm start
cp /usr/local/etc/php.ini-production /usr/local/etc/php.ini

sed -i '' 's|;cgi.fix_pathinfo=1|cgi.fix_pathinfo=0|' /usr/local/etc/php.ini

# MySQL
pkg_add -V mariadb-server
pkg_add -v mariadb-client
rcctl enable mysqld
mysql_install_db
rcctl start mysqld
rcctl stop mysqld
rcctl start mysqld

rcctl check mysqld
echo confirm all typing "Y"
mysql_secure_installation

# PHPMyAdmin
pkg_add phpmyadmin unzip
cp -fR /var/www/phpMyAdmin /var/www/htdocs
cd /tmp
wget https://www.phpmyadmin.net/downloads/phpMyAdmin-latest-all-languages.zip
unzip phpMyAdmin-latest-all-languages.zip
doas mv phpMyAdmin-*/ /var/www/htdocs/phpMyAdmin

echo Go to "http://<ip_addres>/phpMyAdmin/setup"
echo configure phpMyAdmin
echo and press any key
pause
cp -f /var/www/htdocs/phpMyAdmin/setup/config.php /var/www/htdocs/phpMyAdmin/


# NodeJS
pkg install -y node14
npm install -g npm@latest
npm -v

# NAS/SAMBA
pkg install -y samba
cat << EOF > /usr/local/etc/smb.conf
[global]
workgroup = WORKGROUP
netbios name = File Server
server string = FreeBSD Samba Server
max log size = 100
local master = yes
os level = 100
invalid users = nobody root
load printers = no
max connections = 10
preferred master = yes
preserve case = no
disable netbios = yes
dns proxy = no
domain master = yes
default case = lower
encrypt passwords = yes
security = user
hosts allow = 192.168.2.0/24 127.0.0.1
hosts deny = all
bind interfaces only = yes
interfaces = vether0
guest ok = yes
guest only = yes
socket options = TCP_NODELAY IPTOS_LOWDELAY SO_RCVBUF=65536 SO_SNDBUF=65536
strict sync = no
sync always = no
syslog = 1
syslog only = yes

[Files]
comment = files
create mask = 644
path = /home/sambauser/files
writeable = yes
valid users = sambauser
read only = no
browseable = yes
EOF

mkdir /home/sambauser
mkdir /home/sambauser/files
chown nobody:nobody /home/sambauser/files
smbpasswd -a sambauser
service samba_server restart

reboot

