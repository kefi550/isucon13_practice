CREATE DATABASE IF NOT EXISTS `isupipe`;

DROP USER IF EXISTS `isucon`@`%`;
CREATE USER `isucon`@`%` IDENTIFIED BY 'isucon';
GRANT ALL PRIVILEGES ON isupipe.* TO 'isucon'@'%';

CREATE DATABASE IF NOT EXISTS `isudns`;

DROP USER IF EXISTS `isudns`@`%`;
CREATE USER isudns IDENTIFIED BY 'isudns';
GRANT ALL PRIVILEGES ON isudns.* TO 'isudns'@'%';
