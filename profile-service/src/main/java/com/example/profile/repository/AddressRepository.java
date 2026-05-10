package com.example.profile.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.profile.entity.Address;

@Repository
public interface AddressRepository extends JpaRepository<Address, Integer> {
    Optional<Address> findByUserId(String userId);

    List<Address> findAllByUserId(String userId);

    Optional<Address> findByUserIdAndIsDefaultTrue(String userId);

    boolean existsByUserId(String userId);

    void deleteByUserId(String userId);
}
